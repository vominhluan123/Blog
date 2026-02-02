import { Button } from '@/components/ui/button'
import { type Post, POSTS_COLLECTION, PostStatus } from '@/firebase/db'
import { db } from '@/firebase/firebase-config'
import { collection, getDocs, limit, orderBy, query, startAfter, Timestamp, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { doc, updateDoc } from 'firebase/firestore'
import { CheckCircle, Eye, Loader2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { PostContentPreview } from '@/components/PostContentPreview'

const AdminPosts = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [rejectReason, setRejectReason] = useState('')
  const [category, setCategory] = useState('') // Danh mục khi duyệt
  const [isFeatured, setIsFeatured] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [lastDoc, setLastDoc] = useState<any>(null) // lưu document snapshot cuối cùng
  const [hasMore, setHasMore] = useState(true) // còn dữ liệu để load nữa không?
  const PAGE_SIZE = 2 // số bài mỗi lần load (tùy chỉnh được)
  const formInputClass = cn(
    ' rounded-md border  py-6',
    'bg-background/80 text-foreground placeholder-muted-foreground/70',
    'transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-background backdrop-blur-sm',
    'dark:bg-background/50 dark:border-primary/20'
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
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
      setIsSearching(false) // Tắt loading sau khi lọc xong
    }, 300) // 300ms là độ trễ hợp lý, tránh flicker khi gõ nhanh

    return () => clearTimeout(timer) // Cleanup để tránh race condition
  }, [posts, searchTerm])
  // Danh sách category cố định (admin quản lý)
  const categories = ['Hướng dẫn chơi game', 'Esports', 'Review game', 'Mẹo & Thủ thuật']

  // Gọi hàm này 1 lần (ví dụ trong useEffect của trang admin hoặc console)
  useEffect(() => {
    const fetchPendingPosts = async () => {
      try {
        setIsLoading(true)
        const q = query(
          collection(db, POSTS_COLLECTION),
          where('status', '==', PostStatus.PENDING),
          orderBy('createdAt', 'desc'),
          limit(PAGE_SIZE) // Tạm 1 bài
        )
        const snapshot = await getDocs(q)
        const postList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Post)
        setPosts(postList)
        setFilteredPosts(postList)
        // Lưu document cuối cùng để load more
        const lastVisible = snapshot.docs[snapshot.docs.length - 1]
        setLastDoc(lastVisible)
        // Nếu lấy được ít hơn PAGE_SIZE → hết dữ liệu
        setHasMore(snapshot.docs.length === PAGE_SIZE)
      } catch (error) {
        console.error('Lỗi lấy bài chờ duyệt:', error)
        toast.error('Không thể tải danh sách bài!')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPendingPosts()
  }, [])

  const handleApprove = async (postId: string) => {
    if (!category) {
      toast.error('Vui lòng chọn danh mục!')
      return
    }
    try {
      await updateDoc(doc(db, POSTS_COLLECTION, postId), {
        status: PostStatus.APPROVED,
        category,
        isFeatured, // ← Update trường này
        updatedAt: Timestamp.now()
      })

      toast.success('Bài viết đã được duyệt!', {
        description: isFeatured ? 'Bài viết đã được đặt làm nổi bật!' : 'Bài viết đã publish.'
      })

      setPosts(posts.filter((p) => p.id !== postId))
    } catch (error) {
      toast.error('Lỗi duyệt bài!')
    }
  }

  const handleReject = async (postId: string) => {
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do huỷ!')
      return
    }

    try {
      await updateDoc(doc(db, POSTS_COLLECTION, postId), {
        status: PostStatus.REJECTED,
        rejectReason: rejectReason.trim(), // lưu lý do
        updatedAt: Timestamp.now()
      })
      toast.success('Bài viết đã bị huỷ!')
      setPosts(posts.filter((p) => p.id !== postId))
    } catch (error) {
      toast.error('Lỗi huỷ bài!')
    }
  }
  const handleLoadMore = async () => {
    if (!hasMore || isLoading) return
    try {
      setIsLoading(true) // có thể dùng loading riêng cho nút load more nếu muốn

      // Query tiếp theo, bắt đầu từ sau document cuối cùng
      const nextQuery = query(
        collection(db, POSTS_COLLECTION),
        where('status', '==', PostStatus.PENDING),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc), // ← quan trọng nhất
        limit(PAGE_SIZE)
      )

      const snapshot = await getDocs(nextQuery)

      if (snapshot.empty) {
        setHasMore(false)
        return
      }

      const newPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Post[]

      // Thêm vào danh sách hiện tại (append)
      setPosts((prev) => [...prev, ...newPosts])
      setFilteredPosts((prev) => [...prev, ...newPosts]) // nếu đang search thì cũng update

      // Cập nhật document cuối cùng mới
      const lastVisible = snapshot.docs[snapshot.docs.length - 1]
      setLastDoc(lastVisible)

      // Kiểm tra còn dữ liệu nữa không
      setHasMore(snapshot.docs.length === PAGE_SIZE)
    } catch (error) {
      console.error('Lỗi load more:', error)
      toast.error('Không thể tải thêm bài viết')
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className='min-h-screen p-8 bg-background'>
      <div className='max-w-6xl mx-auto'>
        <h1 className='text-3xl font-bold mb-8'>Quản lý bài viết chờ duyệt</h1>

        {/* Search + Tabs (tương lai mở rộng) */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
          <Input
            placeholder='Tìm theo tiêu đề hoặc tác giả...'
            className={cn(formInputClass, 'max-w-sm')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className='flex gap-3 flex-wrap'>
            <Button variant='outline' size='sm'>
              Đã duyệt
            </Button>
            <Button variant='destructive' size='sm'>
              Huỷ
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className='rounded-md border'>
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
                // Loading khi fetch dữ liệu lần đầu
                <>
                  {[...Array(8)].map(
                    (
                      _,
                      i // Hiển thị 8 dòng skeleton
                    ) => (
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
                    )
                  )}
                </>
              ) : isSearching ? (
                // Loading khi đang search/filter
                <TableRow>
                  <TableCell colSpan={6} className='h-32 text-center'>
                    <div className='flex flex-col items-center justify-center gap-3'>
                      <Loader2 className='h-8 w-8 animate-spin text-primary' />
                      <p className='text-sm text-muted-foreground'>Đang tìm kiếm...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='h-32 text-center text-muted-foreground'>
                    {searchTerm ? 'Không tìm thấy bài viết nào phù hợp với từ khóa' : 'Chưa có bài viết nào chờ duyệt'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPosts.map((post) => (
                  <TableRow key={post.id} className='hover:bg-muted/50 transition-colors'>
                    <TableCell className='font-medium'><PostContentPreview content={post.title}/></TableCell>
                    <TableCell>{post.authorName}</TableCell>
                    <TableCell>{post.createdAt.toDate().toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className='flex flex-wrap gap-1'>
                        {post.tags?.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant='secondary' className='text-xs'>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>

                    {/* Cột Preview */}
                    <TableCell className='text-center'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setSelectedPost(post)}
                        className='hover:bg-primary/10'
                      >
                        <Eye className='h-5 w-5 text-primary' />
                      </Button>
                    </TableCell>

                    {/* Hành động */}
                    <TableCell className='text-right flex justify-end gap-2'>
                      {/* Duyệt */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size='sm' variant='default' className='gap-1'>
                            <CheckCircle className='h-4 w-4' />
                            Duyệt
                          </Button>
                        </DialogTrigger>
                        <DialogContent className='sm:max-w-md'>
                          <DialogHeader>
                            <DialogTitle className='text-xl font-bold'>Duyệt bài viết</DialogTitle>
                          </DialogHeader>
                          <div className='space-y-6 py-4'>
                            <div className='space-y-2'>
                              <Label htmlFor='category' className='text-base font-medium text-foreground'>
                                Danh mục
                              </Label>
                              <Select onValueChange={setCategory} defaultValue={category}>
                                <SelectTrigger className={cn(formInputClass, 'w-full h-10 text-base')}>
                                  <SelectValue placeholder='Chọn danh mục...' />
                                </SelectTrigger>
                                <SelectContent
                                  className='max-h-[300px] overflow-y-auto z-50'
                                  position='popper'
                                  sideOffset={4}
                                >
                                  {categories.map((cat) => (
                                    <SelectItem
                                      key={cat}
                                      value={cat}
                                      className='cursor-pointer hover:bg-primary/10 focus:bg-primary/20 transition-colors'
                                    >
                                      {cat}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Checkbox nổi bật */}
                            <div className='flex items-center space-x-2'>
                              <input
                                type='checkbox'
                                id='isFeatured'
                                checked={isFeatured}
                                onChange={(e) => setIsFeatured(e.target.checked)}
                                className='h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary'
                              />
                              <Label htmlFor='isFeatured' className='text-sm font-medium text-foreground'>
                                Đặt làm bài viết nổi bật (hiển thị ở trang chủ)
                              </Label>
                            </div>

                            <div className='flex justify-end gap-3'>
                              <Button
                                variant='outline'
                                onClick={() => {
                                  setCategory('')
                                  setIsFeatured(false)
                                }}
                              >
                                Hủy
                              </Button>
                              <Button
                                onClick={() => handleApprove(post.id)}
                                disabled={!category}
                                className='bg-primary hover:bg-primary/90 text-primary-foreground shadow-md'
                              >
                                Xác nhận duyệt
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Huỷ */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant='destructive' size='sm' className='gap-1'>
                            <XCircle className='h-4 w-4' />
                            Huỷ
                          </Button>
                        </DialogTrigger>
                        <DialogContent className='sm:max-w-md'>
                          <DialogHeader>
                            <DialogTitle className='text-xl font-bold text-destructive'>Huỷ bài viết</DialogTitle>
                          </DialogHeader>
                          <div className='space-y-4'>
                            <Label htmlFor='rejectReason' className='text-base font-medium text-foreground'>
                              Lý do huỷ
                            </Label>
                            <Textarea
                              spellCheck={false}
                              id='rejectReason'
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder='Nhập lý do huỷ bài viết...'
                              className={cn(
                                formInputClass,
                                'min-h-20 max-h-[200px] resize-none text-base',
                                'border-input bg-background placeholder:text-muted-foreground',
                                'focus-visible:ring-destructive/50 focus-visible:ring-offset-background'
                              )}
                            />
                            <div className='flex justify-end gap-3'>
                              <Button variant='outline' onClick={() => setRejectReason('')}>
                                Hủy bỏ
                              </Button>
                              <Button
                                variant='destructive'
                                onClick={() => handleReject(post.id)}
                                disabled={!rejectReason.trim()}
                              >
                                Xác nhận huỷ
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

        {/* Modal Preview bài viết */}
        {selectedPost && (
          <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
            <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
              <DialogHeader>
                <DialogTitle className='text-2xl font-bold'>{selectedPost.title}</DialogTitle>
              </DialogHeader>
              <div className='space-y-6 py-4'>
                {selectedPost.image && (
                  <img
                    src={selectedPost.image}
                    alt={selectedPost.title}
                    className='w-full h-64 object-cover rounded-lg'
                  />
                )}
                <div className='prose dark:prose-invert max-w-none text-foreground'>
                  {/* Render nội dung (giả sử content là HTML) */}
                  <div dangerouslySetInnerHTML={{ __html: selectedPost.content }} />
                </div>
                <div className='text-sm text-muted-foreground'>
                  Tác giả: {selectedPost.authorName} • Ngày gửi: {selectedPost.createdAt.toDate().toLocaleString()}
                </div>
                <div className='flex flex-wrap gap-2'>
                  {selectedPost.tags?.map((tag) => (
                    <Badge key={tag} variant='secondary'>
                      {tag}
                    </Badge>
                  ))}
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
          <p className='text-muted-foreground'>Đã hiển thị hết bài viết chờ duyệt</p>
        )}
      </div>
    </div>
  )
}

export default AdminPosts
