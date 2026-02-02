import { Button } from '@/components/ui/button'
import { Role, type User, USERS_COLLECTION } from '@/firebase/db'
import { db } from '@/firebase/firebase-config'
import { collection, deleteDoc, doc, getDocs, limit, orderBy, query, startAfter } from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { Eye, Loader2, Trash2 } from 'lucide-react'
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

  // Danh sách role từ enum
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
    if (!confirm('Bạn chắc chắn muốn xóa thông tin người dùng này trong Firestore?\n(Tài khoản Auth vẫn tồn tại)')) {
      return
    }

    try {
      await deleteDoc(doc(db, USERS_COLLECTION, userId))
      toast.success('Đã xóa thông tin người dùng')

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
                    <Loader2 className='h-8 w-8 animate-spin mx-auto mb-2 text-primary' />
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
                    <TableCell className='text-center'>
                      <Button variant='ghost' size='icon'>
                        <Eye className='h-4 w-4' />
                      </Button>
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='text-destructive hover:text-destructive/90 hover:bg-destructive/10'
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Đang xóa...
                          </>
                        ) : (
                          <>
                            <Trash2 className='h-4 w-4 mr-1' />
                            Xoá
                          </>
                        )}
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
