// AdminUsers.tsx (cập nhật đầy đủ)
import { Button } from '@/components/ui/button'
import { Role, type User, USERS_COLLECTION } from '@/firebase/db'
import { auth, db } from '@/firebase/firebase-config'
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth' // ← thêm deleteUser
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
import { Eye, Loader2, Trash2, UserPlus, AlertTriangle, Shield } from 'lucide-react'
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
  const [newRole, setNewRole] = useState<Role>(Role.USER)

  // Xác nhận xóa
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const availableRoles = [Role.USER, Role.ADMIN]

  // Search filter
  useEffect(() => {
    const term = searchTerm.toLowerCase().trim()
    setIsSearching(true)
    const timer = setTimeout(() => {
      if (!term) {
        setFilteredUsers(users)
      } else {
        const results = users.filter(
          (u) => 
            u.displayName?.toLowerCase().includes(term) || 
            u.email?.toLowerCase().includes(term)
        )
        setFilteredUsers(results)
      }
      setIsSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [users, searchTerm])

  // Fetch users (admin chỉ)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true)
        const q = query(
          collection(db, USERS_COLLECTION), 
          orderBy('createdAt', 'desc'), 
          limit(PAGE_SIZE)
        )
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
        toast.error('Không có quyền truy cập danh sách người dùng hoặc lỗi kết nối')
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

      // 2. Tạo document Firestore
      await setDoc(doc(db, USERS_COLLECTION, firebaseUser.uid), {
        uid: firebaseUser.uid,
        displayName: newDisplayName,
        email: newEmail,
        role: newRole,
        createdAt: Timestamp.now()
      })

      toast.success('✅ Tạo người dùng thành công!')

      // 3. Refresh danh sách
      const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'), limit(PAGE_SIZE))
      const snapshot = await getDocs(q)
      const userList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as User[]
      setUsers(userList)
      setFilteredUsers(userList)

      // Reset form
      setNewDisplayName('')
      setNewEmail('')
      setNewPassword('')
      setNewRole(Role.USER)
    } catch (error: any) {
      console.error('Lỗi tạo user:', error)
      const errorMsg = error.code === 'auth/email-already-in-use' 
        ? '❌ Email này đã được sử dụng!' 
        : '❌ Không thể tạo người dùng'
      toast.error(errorMsg)
    }
  }

  // XÓA USER HOÀN CHỈNH (Auth + Firestore)
  const handleDeleteUser = async (userId: string) => {
    setDeletingUserId(userId)
    setIsDeleting(true)

    try {
      // 1. Xóa document Firestore trước
      await deleteDoc(doc(db, USERS_COLLECTION, userId))

      // 2. Xóa user trong Firebase Auth (nếu có)
      const userDoc = await getDocs(query(doc(db, USERS_COLLECTION, userId)))
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data() as User
        if (userData.uid && auth.currentUser) {
          // Chỉ admin mới xóa được user khác
          if (auth.currentUser.uid !== userData.uid) {
            await deleteUser(auth.currentUser as any) // Firebase Auth delete
          }
        }
      }

      toast.success('✅ Đã xóa người dùng hoàn toàn!')

      // 3. Cập nhật UI
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      setFilteredUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch (error: any) {
      console.error('Lỗi xóa user:', error)
      toast.error(
        error.code?.includes('auth/admin') 
          ? '❌ Không có quyền xóa user này (chỉ admin tự xóa được)' 
          : '❌ Lỗi xóa người dùng'
      )
    } finally {
      setDeletingUserId(null)
      setIsDeleting(false)
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
        <div className='flex items-center gap-3 mb-8'>
          <Shield className='h-8 w-8 text-primary' />
          <div>
            <h1 className='text-3xl font-bold'>Quản lý người dùng</h1>
            <p className='text-muted-foreground text-sm'>Chỉ Admin mới truy cập được</p>
          </div>
        </div>

        {/* Search + Create button */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
          <Input
            placeholder='Tìm theo tên hoặc email...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              'rounded-md border py-2 px-4 bg-background/80 text-foreground placeholder-muted-foreground/70',
              'max-w-sm h-10'
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
                <DialogTitle className='text-xl font-bold'>Tạo tài khoản Admin/User</DialogTitle>
              </DialogHeader>

              <div className='space-y-4 py-4'>
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
                  <Label htmlFor='password'>Mật khẩu</Label>
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
                  <Select value={newRole} onValueChange={(value) => setNewRole(value as Role)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Role.USER}>👤 User</SelectItem>
                      <SelectItem value={Role.ADMIN}>🛡️ Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='flex justify-end gap-3 pt-4'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => {
                      setNewDisplayName('')
                      setNewEmail('')
                      setNewPassword('')
                      setNewRole(Role.USER)
                    }}
                  >
                    Hủy
                  </Button>
                  <Button onClick={handleCreateUser} disabled={!newEmail || !newPassword}>
                    Tạo ngay
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table */}
        <div className='rounded-xl border bg-card shadow-sm'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên hiển thị</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead className='w-20 text-center'>Xem</TableHead>
                <TableHead className='w-28 text-right'>Hành động</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className='h-4 w-40' /></TableCell>
                    <TableCell><Skeleton className='h-4 w-48' /></TableCell>
                    <TableCell><Skeleton className='h-4 w-28' /></TableCell>
                    <TableCell><Skeleton className='h-4 w-20' /></TableCell>
                    <TableCell><Skeleton className='h-8 w-8 mx-auto rounded-full' /></TableCell>
                    <TableCell><Skeleton className='h-8 w-20 ml-auto' /></TableCell>
                  </TableRow>
                ))
              ) : isSearching ? (
                <TableRow>
                  <TableCell colSpan={6} className='h-32 text-center'>
                    <Loader2 className='h-8 w-8 animate-spin mx-auto mb-2 text-primary' />
                    <p className='text-muted-foreground'>Đang tìm kiếm...</p>
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
                  <TableRow key={user.id} className='hover:bg-accent/50 transition-colors'>
                    <TableCell className='font-medium'>{user.displayName || 'Chưa đặt tên'}</TableCell>
                    <TableCell className='font-mono text-sm'>{user.email || 'N/A'}</TableCell>
                    <TableCell>{user.createdAt?.toDate().toLocaleDateString('vi-VN') || 'N/A'}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ring-2 ring-inset',
                          user.role === Role.ADMIN
                            ? 'bg-red-100 text-red-800 ring-red-200 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-800/50'
                            : 'bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800/50'
                        )}
                      >
                        {user.role === Role.ADMIN ? '🛡️ Admin' : '👤 User'}
                      </span>
                    </TableCell>
                    <TableCell className='text-center'>
                      <Button variant='ghost' size='icon' className='h-8 w-8'>
                        <Eye className='h-4 w-4' />
                      </Button>
                    </TableCell>
                    <TableCell className='text-right'>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10'
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className='flex items-center gap-2 text-destructive'>
                              <AlertTriangle className='h-6 w-6' />
                              Xác nhận xóa
                            </DialogTitle>
                          </DialogHeader>
                          <div className='space-y-4 py-2'>
                            <p className='text-sm text-muted-foreground'>
                              Bạn có chắc chắn muốn <strong>xóa "{user.displayName || user.email}"</strong>?
                            </p>
                            <p className='text-xs bg-destructive/10 p-3 rounded-md border border-destructive/20'>
                              ⚠️ Thao tác này sẽ xóa vĩnh viễn tài khoản Firebase Auth và document Firestore
                            </p>
                            <div className='flex justify-end gap-3 pt-4'>
                              <Button
                                variant='outline'
                                onClick={() => setDeletingUserId(null)}
                                disabled={isDeleting}
                              >
                                Hủy
                              </Button>
                              <Button
                                variant='destructive'
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={isDeleting || deletingUserId !== user.id}
                              >
                                {isDeleting ? (
                                  <>
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    Đang xóa...
                                  </>
                                ) : (
                                  'Xóa vĩnh viễn'
                                )}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Load more */}
        {hasMore && (
          <div className='mt-8 text-center'>
            <Button 
              variant='outline' 
              onClick={handleLoadMore} 
              disabled={isLoading} 
              className='min-w-32'
            >
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Đang tải...
                </>
              ) : (
                'Tải thêm người dùng'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminUsers