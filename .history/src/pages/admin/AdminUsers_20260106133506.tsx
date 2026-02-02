import { Button } from '@/components/ui/button'
import { USERS_COLLECTION } from '@/firebase/db' // Giả sử bạn có type User và USERS_COLLECTION
import { auth, db } from '@/firebase/firebase-config' // Thêm auth nếu chưa có
import { createUserWithEmailAndPassword, type User } from 'firebase/auth' // Để tạo user mới
import { collection, doc, getDocs, limit, orderBy, query, setDoc, startAfter, Timestamp, updateDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/contexts/useAuth'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const AdminUsers = () => {
  const {  } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 10 // Số user mỗi lần load, có thể chỉnh lớn hơn vì user ít hơn post
  const formInputClass = cn(
    'rounded-md border py-6',
    'bg-background/80 text-foreground placeholder-muted-foreground/70',
    'transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-background backdrop-blur-sm',
    'dark:bg-background/50 dark:border-primary/20'
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredUsers, setFilteredUsers] = useState<user[]>([])
  const [selectedUser, setSelectedUser] = useState<user | null>(null)

  // State cho tạo user mới
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserRole, setNewUserRole] = useState('user') // Mặc định role là 'user', có thể có 'admin'

  // Danh sách role cố định
  const roles = ['user', 'admin', 'moderator'] // Tùy chỉnh theo nhu cầu

  useEffect(() => {
    const term = searchTerm.toLowerCase().trim()
    setIsSearching(true)
    const timer = setTimeout(() => {
      if (!term) {
        setFilteredUsers(users)
      } else {
        const results = users.filter((user) => {
          const nameMatch = user.displayName?.toLowerCase().includes(term) || false
          const emailMatch = user.email?.toLowerCase().includes(term) || false
          return nameMatch || emailMatch
        })
        setFilteredUsers(results)
      }
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [users, searchTerm])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true)
        const q = query(
          collection(db, USERS_COLLECTION), // Giả sử collection là 'users'
          orderBy('createdAt', 'desc'),
          limit(PAGE_SIZE)
        )
        const snapshot = await getDocs(q)
        const userList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User))
        setUsers(userList)
        setFilteredUsers(userList)
        const lastVisible = snapshot.docs[snapshot.docs.length - 1]
        setLastDoc(lastVisible)
        setHasMore(snapshot.docs.length === PAGE_SIZE)
      } catch (error) {
        console.error('Lỗi lấy danh sách user:', error)
        toast.error('Không thể tải danh sách user!')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserName) {
      toast.error('Vui lòng điền đầy đủ thông tin!')
      return
    }

    try {
      // Tạo user trong Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, newUserEmail, newUserPassword)
      const user = userCredential.user

      // Lưu thông tin user vào Firestore
      await setDoc(doc(db, USERS_COLLECTION, user.uid), {
        displayName: newUserName,
        email: newUserEmail,
        role: newUserRole,
        createdAt: Timestamp.now()
        // Thêm các field khác nếu cần, ví dụ photoURL, etc.
      })

      toast.success('Tạo user thành công!')
      // Reset form
      setNewUserEmail('')
      setNewUserPassword('')
      setNewUserName('')
      setNewUserRole('user')

      // Refresh danh sách user (có thể fetch lại hoặc append)
      const updatedUsers = [
        ...users,
        {
          id: user.uid,
          displayName: newUserName,
          email: newUserEmail,
          role: newUserRole,
          createdAt: Timestamp.now()
        } as User
      ]
      setUsers(updatedUsers)
      setFilteredUsers(updatedUsers)
    } catch (error) {
      console.error('Lỗi tạo user:', error)
      toast.error('Lỗi tạo user! Kiểm tra email đã tồn tại chưa.')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    // Lưu ý: Xóa user thực tế cần dùng Firebase Admin SDK server-side để an toàn.
    // Ở đây chỉ xóa document Firestore, không xóa Auth user (vì client-side không cho phép).
    // Nếu cần xóa Auth, dùng cloud function hoặc server.
    try {
      await updateDoc(doc(db, USERS_COLLECTION, userId), {
        status: 'deleted', // Hoặc deleteDoc nếu muốn xóa hẳn
        updatedAt: Timestamp.now()
      })
      toast.success('User đã bị xóa!')
      setUsers(users.filter((u) => u.id !== userId))
      setFilteredUsers(filteredUsers.filter((u) => u.id !== userId))
    } catch (error) {
      toast.error('Lỗi xóa user!')
    }
  }

  const handleLoadMore = async () => {
    if (!hasMore || isLoading) return
    try {
      setIsLoading(true)
      const nextQuery = query(
        collection(db, USERS_COLLECTION),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      )
      const snapshot = await getDocs(nextQuery)
      if (snapshot.empty) {
        setHasMore(false)
        return
      }
      const newUsers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as User[]
      setUsers((prev) => [...prev, ...newUsers])
      setFilteredUsers((prev) => [...prev, ...newUsers])
      const lastVisible = snapshot.docs[snapshot.docs.length - 1]
      setLastDoc(lastVisible)
      setHasMore(snapshot.docs.length === PAGE_SIZE)
    } catch (error) {
      console.error('Lỗi load more:', error)
      toast.error('Không thể tải thêm user')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen p-8 bg-background'>
      <div className='max-w-6xl mx-auto'>
        <h1 className='text-3xl font-bold mb-8'>Quản lý người dùng</h1>

        {/* Search + Button tạo mới */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
          <Input
            placeholder='Tìm theo tên hoặc email...'
            className={cn(formInputClass, 'max-w-sm')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className='flex gap-3 flex-wrap'>
            {/* Dialog tạo user mới */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant='default' size='sm'>
                  Tạo user mới
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                  <DialogTitle className='text-xl font-bold'>Tạo user mới</DialogTitle>
                </DialogHeader>
                <div className='space-y-4 py-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='newUserName'>Tên hiển thị</Label>
                    <Input
                      id='newUserName'
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder='Nhập tên hiển thị'
                      className={formInputClass}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='newUserEmail'>Email</Label>
                    <Input
                      id='newUserEmail'
                      type='email'
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder='Nhập email'
                      className={formInputClass}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='newUserPassword'>Mật khẩu tạm</Label>
                    <Input
                      id='newUserPassword'
                      type='password'
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder='Nhập mật khẩu (ít nhất 6 ký tự)'
                      className={formInputClass}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='newUserRole'>Vai trò</Label>
                    <Select onValueChange={setNewUserRole} defaultValue={newUserRole}>
                      <SelectTrigger className={cn(formInputClass, 'w-full h-10 text-base')}>
                        <SelectValue placeholder='Chọn vai trò...' />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='flex justify-end gap-3'>
                    <Button
                      variant='outline'
                      onClick={() => {
                        setNewUserEmail('')
                        setNewUserPassword('')
                        setNewUserName('')
                        setNewUserRole('user')
                      }}
                    >
                      Hủy
                    </Button>
                    <Button onClick={handleCreateUser}>Tạo user</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Table */}
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead className='text-center'>Xem</TableHead>
                <TableHead className='text-right'>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className='h-4 w-full max-w-md' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-32' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-28' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-20' />
                    </TableCell>
                    <TableCell className='text-center'>
                      <Skeleton className='h-8 w-8 rounded mx-auto' />
                    </TableCell>
                    <TableCell className='text-right'>
                      <Skeleton className='h-9 w-16 rounded-md' />
                    </TableCell>
                  </TableRow>
                ))
              ) : isSearching ? (
                <TableRow>
                  <TableCell colSpan={6} className='h-32 text-center'>
                    <div className='flex flex-col items-center justify-center gap-3'>
                      <Loader2 className='h-8 w-8 animate-spin text-primary' />
                      <p className='text-sm text-muted-foreground'>Đang tìm kiếm...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='h-32 text-center text-muted-foreground'>
                    {searchTerm ? 'Không tìm thấy user nào' : 'Chưa có user nào'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className='hover:bg-muted/50 transition-colors'>
                    <TableCell className='font-medium'>{user.displayName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.createdAt?.toDate().toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant='secondary' className='text-xs'>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-center'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setSelectedUser(user)}
                        className='hover:bg-primary/10'
                      >
                        <Eye className='h-5 w-5 text-primary' />
                      </Button>
                    </TableCell>
                    <TableCell className='text-right flex justify-end gap-2'>
                      <Button
                        variant='destructive'
                        size='sm'
                        className='gap-1'
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash className='h-4 w-4' />
                        Xóa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Modal Preview user */}
        {selectedUser && (
          <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
            <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
              <DialogHeader>
                <DialogTitle className='text-2xl font-bold'>{selectedUser.displayName}</DialogTitle>
              </DialogHeader>
              <div className='space-y-6 py-4'>
                <div className='text-sm text-muted-foreground'>
                  Email: {selectedUser.email} • Ngày tạo: {selectedUser.createdAt?.toDate().toLocaleString()}
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Badge variant='secondary'>Vai trò: {selectedUser.role}</Badge>
                  {/* Thêm thông tin khác nếu có, ví dụ posts count, etc. */}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className='mt-10 text-center'>
        {hasMore ? (
          <Button onClick={handleLoadMore} disabled={isLoading} className='min-w-[140px]'>
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Đang tải...
              </>
            ) : (
              'Tải thêm'
            )}
          </Button>
        ) : (
          <p className='text-muted-foreground'>Đã hiển thị hết user</p>
        )}
      </div>
    </div>
  )
}

export default AdminUsers
