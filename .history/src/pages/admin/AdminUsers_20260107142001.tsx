// AdminUsers.tsx
import { Button } from '@/components/ui/button'
import { Role, type User, USERS_COLLECTION, UserStatus } from '@/firebase/db'
import { db } from '@/firebase/firebase-config'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  Timestamp,
  updateDoc
} from 'firebase/firestore'
import { useEffect, useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { Eye, Loader2, Save, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

// Giả định interface User đã được cập nhật với photoURL và status
// Nếu chưa, thêm vào db.ts:
// export interface User {
//   ... fields cũ
//   photoURL?: string
//   status?: 'active' | 'banned'
// }

const AdminUsers = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 10

  const [searchTerm, setSearchTerm] = useState('')
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // State cho delete per row
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  // State cho xem chi tiết & edit
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<User>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isFormDirty, setIsFormDirty] = useState(false) // Track nếu form có thay đổi

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

  const handleDeleteUser = async (userId: string) => {
    setDeletingUserId(userId)
    try {
      await deleteDoc(doc(db, USERS_COLLECTION, userId))
      toast.success('Đã xóa thông tin người dùng')
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      setFilteredUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch (error) {
      console.error('Lỗi xóa user:', error)
      toast.error('Không thể xóa người dùng')
    } finally {
      setDeletingUserId(null)
    }
  }

  const handleSaveEdit = async () => {
    if (!selectedUser?.id || !editForm.displayName || !editForm.role) return

    setIsSaving(true)
    try {
      await updateDoc(doc(db, USERS_COLLECTION, selectedUser.id), {
        displayName: editForm.displayName,
        role: editForm.role,
        photoURL: editForm.photoURL,
        status: editForm.status,
        updatedAt: Timestamp.now()
      })

      toast.success('Cập nhật thông tin thành công!')

      // Cập nhật danh sách
      const updatedUser = { ...selectedUser, ...editForm }
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? updatedUser : u)))
      setFilteredUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? updatedUser : u)))

      setIsEditing(false)
      setIsFormDirty(false)
    } catch (error) {
      console.error('Lỗi cập nhật user:', error)
      toast.error('Không thể cập nhật')
    } finally {
      setIsSaving(false)
    }
  }

  // Kiểm tra form có thay đổi (dirty) không để enable nút Save
  useEffect(() => {
    if (!selectedUser || !isEditing) return

    const original = {
      displayName: selectedUser.displayName,
      role: selectedUser.role,
      photoURL: selectedUser.photoURL,
      status: selectedUser.status || 'active' // fallback nếu chưa có
    }

    const current = {
      displayName: editForm.displayName,
      role: editForm.role,
      photoURL: editForm.photoURL,
      status: editForm.status
    }

    setIsFormDirty(JSON.stringify(original) !== JSON.stringify(current))
  }, [editForm, selectedUser, isEditing])

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

        {/* Search */}
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
                <TableHead>Trạng thái</TableHead>
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
                      <Skeleton className='h-4 w-24' />
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
                  <TableCell colSpan={7} className='h-32 text-center'>
                    <Loader2 className='h-8 w-8 animate-spin mx-auto mb-2 text-primary' />
                    <p>Đang tìm kiếm...</p>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className='h-32 text-center text-muted-foreground'>
                    {searchTerm ? 'Không tìm thấy người dùng nào' : 'Chưa có người dùng nào'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const isDeleting = deletingUserId === user.id

                  return (
                    <TableRow key={user.id}>
                      <TableCell className='font-medium'>{user.displayName || 'Chưa đặt tên'}</TableCell>
                      <TableCell>{user.email || 'N/A'}</TableCell>
                      <TableCell>{user.createdAt ? user.createdAt.toDate().toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-block px-2.5 py-1 text-xs font-medium rounded-full',
                            user.role === Role.ADMIN
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                          )}
                        >
                          {user.role === Role.ADMIN ? '🛡️ Admin' : '👤 User'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-block px-2.5 py-1 text-xs font-medium rounded-full',
                            user.status === 'banned'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          )}
                        >
                          {user.status === UserStatus.BANNED ? 'Banned' : 'Active'}
                        </span>
                      </TableCell>
                      <TableCell className='text-center'>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => {
                            setSelectedUser(user)
                            setEditForm({
                              displayName: user.displayName,
                              role: user.role,
                              photoURL: user.photoURL,
                              status: user.status || 'active'
                            })
                            setIsEditing(false)
                            setIsFormDirty(false)
                          }}
                        >
                          <Eye className='h-4 w-4' />
                        </Button>
                      </TableCell>
                      <TableCell className='text-right'>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='text-destructive hover:text-destructive/90 hover:bg-destructive/10'
                              disabled={isDeleting}
                            >
                              <Trash2 className='h-4 w-4 mr-1' />
                              Xoá
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Xác nhận xóa người dùng</DialogTitle>
                              <DialogDescription>
                                Bạn có chắc chắn muốn xóa thông tin người dùng{' '}
                                <strong>{user.displayName || user.email}</strong> trong Firestore không? (Tài khoản Auth
                                vẫn còn, chỉ xóa dữ liệu trong database)
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant='outline' disabled={isDeleting}>
                                Hủy
                              </Button>
                              <Button
                                variant='destructive'
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={isDeleting}
                              >
                                {isDeleting ? (
                                  <>
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    Đang xóa...
                                  </>
                                ) : (
                                  'Xác nhận xóa'
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  )
                })
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

        {/* Dialog Xem chi tiết & Edit */}
        {selectedUser && (
          <Dialog
            open={!!selectedUser}
            onOpenChange={() => {
              setSelectedUser(null)
              setIsEditing(false)
            }}
          >
            <DialogContent className='sm:max-w-md'>
              <DialogHeader>
                <DialogTitle>{isEditing ? 'Chỉnh sửa người dùng' : 'Chi tiết người dùng'}</DialogTitle>
              </DialogHeader>

              {isEditing ? (
                <div className='space-y-6 py-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='displayName'>Tên hiển thị</Label>
                    <Input
                      id='displayName'
                      value={editForm.displayName || ''}
                      onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label>Vai trò</Label>
                    <Select
                      value={editForm.role}
                      onValueChange={(value) => setEditForm({ ...editForm, role: value as Role })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Chọn vai trò' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Role.USER}>User</SelectItem>
                        <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label>Trạng thái</Label>
                    <Select
                      value={editForm.status || 'active'}
                      onValueChange={(value) => setEditForm({ ...editForm, status: value as 'active' | 'banned' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Chọn trạng thái' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='active'>Active</SelectItem>
                        <SelectItem value='banned'>Banned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className='space-y-4 py-4'>
                  {selectedUser.photoURL && (
                    <div className='flex justify-center'>
                      <img
                        src={selectedUser.photoURL}
                        alt='Ảnh đại diện'
                        className='w-24 h-24 rounded-full object-cover border border-border'
                      />
                    </div>
                  )}
                  <div>
                    <strong>Tên hiển thị:</strong> {selectedUser.displayName || 'Chưa đặt'}
                  </div>
                  <div>
                    <strong>Email:</strong> {selectedUser.email || 'N/A'}
                  </div>
                  <div>
                    <strong>Vai trò:</strong>{' '}
                    <span
                      className={cn(
                        'inline-block px-2.5 py-0.5 text-xs font-medium rounded-full',
                        selectedUser.role === Role.ADMIN
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      )}
                    >
                      {selectedUser.role === Role.ADMIN ? '🛡️ Admin' : '👤 User'}
                    </span>
                  </div>
                  <div>
                    <strong>Trạng thái:</strong>{' '}
                    <span
                      className={cn(
                        'inline-block px-2.5 py-0.5 text-xs font-medium rounded-full',
                        selectedUser.status === UserStatus.ACTIVE
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      )}
                    >
                      {selectedUser.status === UserStatus.BANNED ? 'Banned' : 'Active'}
                    </span>
                  </div>
                  <div>
                    <strong>Ngày tạo:</strong>{' '}
                    {selectedUser.createdAt ? selectedUser.createdAt.toDate().toLocaleString() : 'N/A'}
                  </div>
                  <div>
                    <strong>UID:</strong> {selectedUser.uid}
                  </div>
                </div>
              )}

              <DialogFooter className='gap-2 sm:gap-0'>
                {isEditing ? (
                  <>
                    <Button variant='outline' onClick={() => setIsEditing(false)} disabled={isSaving}>
                      <X className='mr-2 h-4 w-4' />
                      Hủy
                    </Button>
                    <Button onClick={handleSaveEdit} disabled={isSaving || !isFormDirty}>
                      {isSaving ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Save className='mr-2 h-4 w-4' />
                          Lưu thay đổi
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant='outline' onClick={() => setSelectedUser(null)}>
                      Đóng
                    </Button>
                    <Button onClick={() => setIsEditing(true)}>Chỉnh sửa</Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}

export default AdminUsers
