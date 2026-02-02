// AdminUsers.tsx
import { Button } from '@/components/ui/button'
import { Role, type User, USERS_COLLECTION } from '@/firebase/db' // Type User của bạn
import { auth, db } from '@/firebase/firebase-config'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  startAfter,
  Timestamp
} from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { Eye, Loader2, Trash2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

const AdminUsers = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 10

  const [searchTerm, setSearchTerm] = useState('')
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Form tạo user mới
  const [newDisplayName, setNewDisplayName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState()


  // Search filter
  useEffect(() => {
    const term = searchTerm.toLowerCase().trim()
    setIsSearching(true)
    const timer = setTimeout(() => {
      if (!term) {
        setFilteredUsers(users)
      } else {
        const results = users.filter(
          (u) => u.displayName?.toLowerCase().includes(term) || false || u.email?.toLowerCase().includes(term) || false
        )
        setFilteredUsers(results)
      }
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [users, searchTerm])

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true)
        const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'), limit(PAGE_SIZE))
        const snapshot = await getDocs(q)
        const userList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })) as User[]

        setUsers(userList)
        setFilteredUsers(userList)

        const lastVisible = snapshot.docs[snapshot.docs.length - 1]
        setLastDoc(lastVisible)
        setHasMore(snapshot.docs.length === PAGE_SIZE)
      } catch (error) {
        console.error('Lỗi tải danh sách user:', error)
        toast.error('Không thể tải danh sách người dùng')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const handleCreateUser = async () => {
    if (!newEmail || !newPassword || !newDisplayName) {
      toast.error('Vui lòng điền đầy đủ thông tin!')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Mật khẩu phải ít nhất 6 ký tự!')
      return
    }

    try {
      // 1. Tạo user trong Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, newEmail, newPassword)
      const firebaseUser = userCredential.user

      // 2. Tạo document trong Firestore (giống logic trong useAuth)
      await setDoc(doc(db, USERS_COLLECTION, firebaseUser.uid), {
        uid: firebaseUser.uid,
        displayName: newDisplayName,
        email: newEmail,
        role: newRole,
        createdAt: Timestamp.now()
        // Có thể thêm các field khác nếu cần: photoURL, lastLogin, etc.
      })

      toast.success('Tạo người dùng thành công!')

      // 3. Thêm vào danh sách hiện tại (không cần fetch lại toàn bộ)
      const newUser: User = {
        id: firebaseUser.uid,
        displayName: newDisplayName,
        email: newEmail,
        role: Role,
        createdAt: Timestamp.now()
      }

      setUsers((prev) => [newUser, ...prev]) // Thêm lên đầu cho mới nhất
      setFilteredUsers((prev) => [newUser, ...prev])

      // Reset form
      setNewDisplayName('')
      setNewEmail('')
      setNewPassword('')
      setNewRole('user')
    } catch (error: any) {
      console.error('Lỗi tạo user:', error)
      toast.error(
        error.code === 'auth/email-already-in-use'
          ? 'Email này đã được sử dụng!'
          : 'Không thể tạo người dùng. Vui lòng thử lại.'
      )
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa người dùng này? (Chỉ xóa document, tài khoản Auth vẫn còn)')) return

    try {
      await deleteDoc(doc(db, USERS_COLLECTION, userId))
      toast.success('Đã xóa thông tin người dùng trong Firestore')

      setUsers((prev) => prev.filter((u) => u.id !== userId))
      setFilteredUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch (error) {
      console.error('Lỗi xóa user:', error)
      toast.error('Không thể xóa người dùng')
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
      toast.error('Không thể tải thêm')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen p-8 bg-background'>
      <div className='max-w-6xl mx-auto'>
        <h1 className='text-3xl font-bold mb-8'>Quản lý người dùng</h1>

        {/* Search + Create button */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
          <Input
            placeholder='Tìm theo tên hoặc email...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              'rounded-md border py-6 bg-background/80 text-foreground placeholder-muted-foreground/70',
              'max-w-sm'
            )}
          />

          <Dialog>
            <DialogTrigger asChild>
              <Button className='gap-2'>
                <UserPlus className='h-4 w-4' />
                Tạo user mới
              </Button>
            </DialogTrigger>

            <DialogContent className='sm:max-w-md'>
              <DialogHeader>
                <DialogTitle className='text-xl'>Tạo tài khoản người dùng</DialogTitle>
              </DialogHeader>

              <div className='space-y-5 py-4'>
                <div className='space-y-2'>
                  <Label htmlFor='displayName'>Tên hiển thị</Label>
                  <Input
                    id='displayName'
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    placeholder='Ví dụ: GamerPro123'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='email'>Email</Label>
                  <Input
                    id='email'
                    type='email'
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder='example@gmail.com'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='password'>Mật khẩu tạm</Label>
                  <Input
                    id='password'
                    type='password'
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder='Tối thiểu 6 ký tự'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='role'>Vai trò</Label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger>
                      <SelectValue placeholder='Chọn vai trò' />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='flex justify-end gap-3 pt-4'>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setNewDisplayName('')
                      setNewEmail('')
                      setNewPassword('')
                      setNewRole('user')
                    }}
                  >
                    Hủy
                  </Button>
                  <Button onClick={handleCreateUser}>Tạo ngay</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table */}
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên hiển thị</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead className='w-20 text-center'>Xem</TableHead>
                <TableHead className='w-24 text-right'>Hành động</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className='h-4 w-40' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-48' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-28' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-20' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-8 w-8 mx-auto' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-8 w-16 ml-auto' />
                    </TableCell>
                  </TableRow>
                ))
              ) : isSearching ? (
                <TableRow>
                  <TableCell colSpan={6} className='h-32 text-center'>
                    <Loader2 className='h-8 w-8 animate-spin mx-auto mb-2' />
                    <p>Đang tìm kiếm...</p>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='h-32 text-center text-muted-foreground'>
                    {searchTerm ? 'Không tìm thấy người dùng nào' : 'Chưa có người dùng nào'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className='font-medium'>{user.displayName || 'Chưa đặt tên'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.createdAt ? user.createdAt.toDate().toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-block px-2 py-1 text-xs rounded-full',
                          user.role === 'admin'
                            ? 'bg-red-100 text-red-800'
                            : user.role === 'moderator'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        )}
                      >
                        {user.role || 'user'}
                      </span>
                    </TableCell>
                    <TableCell className='text-center'>
                      <Button variant='ghost' size='icon'>
                        <Eye className='h-4 w-4' />
                      </Button>
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='text-destructive hover:text-destructive/90'
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className='h-4 w-4 mr-1' />
                        Xóa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Load more */}
        <div className='mt-8 text-center'>
          {hasMore ? (
            <Button variant='outline' onClick={handleLoadMore} disabled={isLoading} className='min-w-32'>
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
            <p className='text-sm text-muted-foreground'>Đã hiển thị hết người dùng</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminUsers
