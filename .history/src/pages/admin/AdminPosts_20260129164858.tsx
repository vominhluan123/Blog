import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type Post, POSTS_COLLECTION, PostStatus } from '@/firebase/db'
import { db } from '@/firebase/firebase-config'
import { cn } from '@/lib/utils'
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore'
import { CheckCircle, Eye, Loader2, RefreshCw, Trash2, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import 'react-quill-new/dist/quill.snow.css'
import { toast } from 'sonner'

const AdminPosts = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [rejectReason, setRejectReason] = useState('')
  const [category, setCategory] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 10 // Tăng lên 10 cho admin xem thoải mái hơn

  const formInputClass = cn(
    'rounded-md border py-6',
    'bg-background/80 text-foreground placeholder-muted-foreground/70',
    'transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-background backdrop-blur-sm',
    'dark:bg-background/50 dark:border-primary/20'
  )

  const [searchTerm, setSearchTerm] = useState('')
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [activeTab, setActiveTab] = useState<PostStatus | 'deleted'>(PostStatus.PENDING)

  // Danh sách category
  const categories = ['Hướng dẫn chơi game', 'Esports', 'Review game', 'Mẹo & Thủ thuật']

  // Fetch posts theo tab
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true)
        setHasMore(true)
        setLastDoc(null)

        let q = query(collection(db, POSTS_COLLECTION), orderBy('createdAt', 'desc'), limit(PAGE_SIZE))

        // Filter theo tab
        if (activeTab === 'deleted') {
          q = query(q, where('isDeleted', '==', true))
        } else {
          q = query(q, where('status', '==', activeTab))
        }

        const snapshot = await getDocs(q)
        const postList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Post)

        setPosts(postList)
        setFilteredPosts(postList)

        const lastVisible = snapshot.docs[snapshot.docs.length - 1]
        setLastDoc(lastVisible)
        setHasMore(snapshot.docs.length === PAGE_SIZE)
      } catch (error) {
        console.error('Lỗi tải bài viết:', error)
        toast.error('Không thể tải danh sách bài viết')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPosts()
  }, [activeTab])

  // Search filter (client-side)
  useEffect(() => {
    const term = searchTerm.toLowerCase().trim()
    setIsSearching(true)
    const timer = setTimeout(() => {
      if (!term) {
        setFilteredPosts(posts)
      } else {
        const results = posts.filter((post) => {
          const titleMatch = post.title?.toLowerCase().includes(term) || false
          const authorMatch = post.authorName?.toLowerCase().includes(term) || false
          return titleMatch || authorMatch
        })
        setFilteredPosts(results)
      }
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [posts, searchTerm])

  // Load more
  const handleLoadMore = async () => {
    if (!hasMore || isLoading || !lastDoc) return
    setIsLoading(true)

    try {
      let nextQ = query(
        collection(db, POSTS_COLLECTION),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      )

      if (activeTab === 'deleted') {
        nextQ = query(nextQ, where('isDeleted', '==', true))
      } else {
        nextQ = query(nextQ, where('status', '==', activeTab))
      }

      const snapshot = await getDocs(nextQ)
      if (snapshot.empty) {
        setHasMore(false)
        return
      }

      const newPosts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Post)
      setPosts((prev) => [...prev, ...newPosts])
      setFilteredPosts((prev) => [...prev, ...newPosts])

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

  // Duyệt bài
  const handleApprove = async (postId: string) => {
    if (!category) {
      toast.error('Vui lòng chọn danh mục!')
      return
    }
    try {
      await updateDoc(doc(db, POSTS_COLLECTION, postId), {
        status: PostStatus.APPROVED,
        category,
        isFeatured,
        updatedAt: Timestamp.now()
      })
      toast.success('Đã duyệt!', { description: isFeatured ? 'Bài nổi bật!' : 'Đã publish.' })
      setPosts((prev) => prev.filter((p) => p.id !== postId))
    } catch (err) {
      toast.error('Lỗi duyệt bài')
    }
  }

  // Huỷ bài
  const handleReject = async (postId: string) => {
    if (!rejectReason.trim()) {
      toast.error('Nhập lý do huỷ!')
      return
    }
    try {
      await updateDoc(doc(db, POSTS_COLLECTION, postId), {
        status: PostStatus.REJECTED,
        rejectReason: rejectReason.trim(),
        updatedAt: Timestamp.now()
      })
      toast.success('Đã huỷ!')
      setPosts((prev) => prev.filter((p) => p.id !== postId))
    } catch (err) {
      toast.error('Lỗi huỷ bài')
    }
  }

  // Xóa (soft delete)
  const handleDelete = async (postId: string) => {
    try {
      await updateDoc(doc(db, POSTS_COLLECTION, postId), {
        isDeleted: true,
        deletedAt: Timestamp.now(),
        status: PostStatus.DELETED || 'deleted', // nếu enum có DELETED thì dùng
        deletedBy: 'admin' // thay bằng current admin uid nếu có auth
      })
      toast.success('Đã xóa bài!')
      setPosts((prev) => prev.filter((p) => p.id !== postId))
    } catch (err) {
      toast.error('Lỗi xóa bài')
    }
  }

  // Khôi phục bài (từ Rejected hoặc Deleted)
  const handleRestore = async (postId: string) => {
    try {
      const updates: any = {
        updatedAt: Timestamp.now()
      }

      if (activeTab === PostStatus.REJECTED) {
        updates.status = PostStatus.PENDING
        updates.rejectReason = null
      } else if (activeTab === 'deleted') {
        updates.isDeleted = false
        updates.deletedAt = null
        updates.status = PostStatus.PENDING // hoặc status cũ nếu bạn lưu history
      }

      await updateDoc(doc(db, POSTS_COLLECTION, postId), updates)
      toast.success('Đã khôi phục bài viết!')
      setPosts((prev) => prev.filter((p) => p.id !== postId))
    } catch (err) {
      toast.error('Lỗi khôi phục')
      console.error(err)
    }
  }

  return (
    <div className='min-h-screen p-8 bg-background'>
      <div className='max-w-7xl mx-auto'>
        <h1 className='text-3xl font-bold mb-8'>Quản lý bài viết</h1>

        {/* Tabs lọc trạng thái */}
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as PostStatus | 'deleted')} className='mb-6'>
          <TabsList className='grid w-full grid-cols-4 md:w-auto md:inline-flex'>
            <TabsTrigger value={PostStatus.PENDING}>Chờ duyệt</TabsTrigger>
            <TabsTrigger value={PostStatus.APPROVED}>Đã duyệt</TabsTrigger>
            <TabsTrigger value={PostStatus.REJECTED}>Bị huỷ</TabsTrigger>
            <TabsTrigger value='deleted'>Đã xóa</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
          <Input
            placeholder='Tìm theo tiêu đề hoặc tác giả...'
            className={cn(formInputClass, 'max-w-sm')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className='rounded-md border overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Tác giả</TableHead>
                <TableHead>Ngày gửi</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className='text-center'>Preview</TableHead>
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
                      <div className='flex gap-1'>
                        <Skeleton className='h-5 w-16 rounded-full' />
                        <Skeleton className='h-5 w-20 rounded-full' />
                      </div>
                    </TableCell>
                    <TableCell className='text-center'>
                      <Skeleton className='h-8 w-8 rounded mx-auto' />
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex justify-end gap-2'>
                        <Skeleton className='h-9 w-20 rounded-md' />
                        <Skeleton className='h-9 w-16 rounded-md' />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : isSearching ? (
                <TableRow>
                  <TableCell colSpan={6} className='h-32 text-center'>
                    <div className='flex flex-col items-center justify-center gap-3'>
                      <Loader2 className='h-8 w-8 animate-spin text-primary' />
                      <p>Đang tìm kiếm...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='h-32 text-center text-muted-foreground'>
                    {searchTerm ? 'Không tìm thấy bài phù hợp' : `Chưa có bài ở trạng thái "${activeTab}"`}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPosts.map((post) => (
                  <TableRow key={post.id} className='hover:bg-muted/50 transition-colors'>
                    <TableCell className='font-medium'>{post.title}</TableCell>
                    <TableCell>{post.authorName}</TableCell>
                    <TableCell>{post.createdAt?.toDate().toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell>
                      <div className='flex flex-wrap gap-1'>
                        {post.tags?.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant='secondary' className='text-xs'>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className='text-center'>
                      <Button variant='ghost' size='sm' onClick={() => setSelectedPost(post)}>
                        <Eye className='h-5 w-5 text-primary' />
                      </Button>
                    </TableCell>
                    <TableCell className='text-right flex justify-end gap-2 flex-wrap'>
                      {activeTab === PostStatus.PENDING && (
                        <>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size='sm' variant='default' className='gap-1'>
                                <CheckCircle className='h-4 w-4' /> Duyệt
                              </Button>
                            </DialogTrigger>
                            {/* Dialog duyệt giữ nguyên như cũ */}
                            <DialogContent className='sm:max-w-md'>{/* ... nội dung dialog duyệt ... */}</DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant='destructive' size='sm' className='gap-1'>
                                <XCircle className='h-4 w-4' /> Huỷ
                              </Button>
                            </DialogTrigger>
                            {/* Dialog huỷ giữ nguyên */}
                          </Dialog>
                        </>
                      )}

                      {/* Nút Xóa - hiện ở mọi tab trừ đã xóa */}
                      {activeTab !== 'deleted' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant='outline' size='sm' className='gap-1 text-destructive'>
                              <Trash2 className='h-4 w-4' /> Xóa
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className='text-destructive'>Xóa bài viết?</DialogTitle>
                            </DialogHeader>
                            <p className='text-sm text-muted-foreground py-4'>
                              Bài sẽ bị xóa mềm (soft delete), có thể khôi phục sau.
                            </p>
                            <div className='flex justify-end gap-3'>
                              <Button variant='outline'>Hủy</Button>
                              <Button variant='destructive' onClick={() => handleDelete(post.id)}>
                                Xác nhận xóa
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      {/* Nút Khôi phục - chỉ ở tab Rejected và Deleted */}
                      {(activeTab === PostStatus.REJECTED || activeTab === 'deleted') && (
                        <Button
                          size='sm'
                          variant='outline'
                          className='gap-1 text-green-600 hover:text-green-700'
                          onClick={() => handleRestore(post.id)}
                        >
                          <RefreshCw className='h-4 w-4' /> Khôi phục
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Load more */}
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
            <p className='text-muted-foreground'>Đã hiển thị hết</p>
          )}
        </div>

        {/* Preview modal giữ nguyên */}
        {selectedPost && (
          <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
            {/* ... nội dung preview modal ... */}
          </Dialog>
        )}
      </div>
    </div>
  )
}

export default AdminPosts
