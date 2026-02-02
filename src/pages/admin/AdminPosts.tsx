import QuillPreview from '@/components/QuillPreview'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { type Post, POSTS_COLLECTION, PostStatus, Role } from '@/firebase/db'
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
  const PAGE_SIZE = 10

  const formInputClass = cn(
    'rounded-md border py-6',
    'bg-background/80 text-foreground placeholder-muted-foreground/70',
    'transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-background backdrop-blur-sm',
    'dark:bg-background/50 dark:border-primary/20'
  )

  const [searchTerm, setSearchTerm] = useState('')
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [activeTab, setActiveTab] = useState<PostStatus>(PostStatus.PENDING)

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

        if (activeTab === PostStatus.DELETED) {
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

  // Search filter
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

      if (activeTab === PostStatus.DELETED) {
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
      toast.success('Đã duyệt!', {
        description: isFeatured ? 'Bài nổi bật!' : 'Đã publish.'
      })
      setPosts((prev) => prev.filter((p) => p.id !== postId))
    } catch (err) {
      toast.error('Lỗi duyệt bài')
    }
  }

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

  const handleDelete = async (postId: string) => {
    try {
      await updateDoc(doc(db, POSTS_COLLECTION, postId), {
        isDeleted: true,
        deletedAt: Timestamp.now(),
        status: PostStatus.DELETED,
        deletedBy: Role.ADMIN // thay bằng auth.currentUser?.uid nếu có
      })
      toast.success('Đã xóa bài!')
      setPosts((prev) => prev.filter((p) => p.id !== postId))
    } catch (err) {
      toast.error('Lỗi xóa bài')
    }
  }

  const handleRestore = async (postId: string) => {
    try {
      const updates: any = {
        updatedAt: Timestamp.now()
      }

      if (activeTab === PostStatus.REJECTED) {
        updates.status = PostStatus.PENDING
        updates.rejectReason = null
      } else if (activeTab === PostStatus.DELETED) {
        updates.isDeleted = false
        updates.deletedAt = null
        updates.status = PostStatus.PENDING
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
    <div className='min-h-screen bg-background p-6 md:p-8'>
      <div className='mx-auto max-w-7xl'>
        {/* Header */}
        <div className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <h1 className='text-3xl font-bold tracking-tight'>Quản lý bài viết</h1>
          <Input
            placeholder='Tìm theo tiêu đề hoặc tác giả...'
            className={cn(formInputClass, 'max-w-sm bg-background/80 backdrop-blur-sm border-muted')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as PostStatus)} className='mb-8'>
          <TabsList className='grid w-full grid-cols-2 sm:grid-cols-4 lg:w-auto lg:inline-flex'>
            <TabsTrigger value={PostStatus.PENDING}>Chờ duyệt</TabsTrigger>
            <TabsTrigger value={PostStatus.APPROVED}>Đã duyệt</TabsTrigger>
            <TabsTrigger value={PostStatus.REJECTED}>Bị từ chối</TabsTrigger>
            <TabsTrigger value={PostStatus.DELETED}>Đã xóa</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Table */}
        <div className='rounded-xl border bg-card shadow-sm overflow-hidden'>
          <Table>
            <TableHeader className='bg-muted/50'>
              <TableRow>
                <TableHead className='w-[35%]'>Tiêu đề</TableHead>
                <TableHead className='w-[15%]'>Tác giả</TableHead>
                <TableHead className='w-[12%]'>Ngày gửi</TableHead>
                <TableHead className='w-[15%]'>Tags</TableHead>
                <TableHead className='w-20 text-center'>Preview</TableHead>
                <TableHead className='w-[23%] text-right pr-6'>Hành động</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className='h-5 w-4/5' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-5 w-28' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-5 w-24' />
                    </TableCell>
                    <TableCell>
                      <div className='flex gap-2'>
                        <Skeleton className='h-6 w-16 rounded-full' />
                        <Skeleton className='h-6 w-20 rounded-full' />
                      </div>
                    </TableCell>
                    <TableCell className='text-center'>
                      <Skeleton className='h-8 w-8 mx-auto rounded' />
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex justify-end gap-2'>
                        <Skeleton className='h-9 w-20 rounded-md' />
                        <Skeleton className='h-9 w-20 rounded-md' />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : isSearching ? (
                <TableRow>
                  <TableCell colSpan={6} className='h-64 text-center'>
                    <div className='flex flex-col items-center justify-center gap-4'>
                      <Loader2 className='h-10 w-10 animate-spin text-primary' />
                      <p className='text-muted-foreground'>Đang tìm kiếm...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='h-64 text-center'>
                    <div className='flex flex-col items-center justify-center gap-3 text-muted-foreground'>
                      <p className='text-lg'>
                        {searchTerm
                          ? 'Không tìm thấy bài viết nào phù hợp'
                          : `Chưa có bài viết ở trạng thái "${activeTab === PostStatus.DELETED ? 'Đã xóa' : activeTab}"`}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPosts.map((post) => (
                  <TableRow key={post.id} className='hover:bg-muted/30 transition-colors'>
                    <TableCell className='font-medium'>{post.title}</TableCell>
                    <TableCell className='text-muted-foreground'>{post.authorName}</TableCell>
                    <TableCell className='text-muted-foreground text-sm'>
                      {post.createdAt?.toDate().toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-wrap gap-1'>
                        {post.tags?.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant='secondary' className='text-xs px-2 py-0.5'>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell className='text-center'>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => setSelectedPost(post)}
                        className='hover:bg-primary/10'
                      >
                        <Eye className='h-5 w-5 text-primary' />
                      </Button>
                    </TableCell>

                    <TableCell className='text-right pr-6'>
                      <div className='flex items-center justify-end gap-2 flex-wrap'>
                        {activeTab === PostStatus.PENDING && (
                          <>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size='sm' variant='default' className='gap-1.5 shadow-sm'>
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

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size='sm' variant='destructive' className='gap-1.5'>
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
                          </>
                        )}

                        {activeTab !== PostStatus.DELETED && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size='sm'
                                variant='outline'
                                className='gap-1.5 text-destructive hover:text-destructive/90 border-destructive/30 hover:bg-destructive/10'
                              >
                                <Trash2 className='h-4 w-4' />
                                Xóa
                              </Button>
                            </DialogTrigger>
                            <DialogContent className='sm:max-w-md'>
                              <DialogHeader>
                                <DialogTitle className='text-destructive text-xl'>Xóa bài viết?</DialogTitle>
                              </DialogHeader>
                              <div className='py-4 space-y-4'>
                                <p className='text-sm text-muted-foreground'>
                                  Bài viết sẽ bị xóa mềm và có thể khôi phục sau.
                                </p>
                                <p className='text-sm font-medium'>{post.title}</p>
                              </div>
                              <div className='flex justify-end gap-3'>
                                <Button variant='outline'>Hủy</Button>
                                <Button variant='destructive' onClick={() => handleDelete(post.id)}>
                                  Xác nhận xóa
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}

                        {(activeTab === PostStatus.REJECTED || activeTab === PostStatus.DELETED) && (
                          <Button
                            size='sm'
                            variant='outline'
                            className='gap-1.5 text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50'
                            onClick={() => handleRestore(post.id)}
                          >
                            <RefreshCw className='h-4 w-4' />
                            Khôi phục
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Load more */}
        <div className='mt-10 flex justify-center'>
          {hasMore ? (
            <Button onClick={handleLoadMore} disabled={isLoading} variant='outline' className='min-w-[180px]'>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Đang tải thêm...
                </>
              ) : (
                'Tải thêm bài viết'
              )}
            </Button>
          ) : (
            <p className='text-sm text-muted-foreground italic'>Đã hiển thị tất cả bài viết phù hợp</p>
          )}
        </div>

        {/* Preview Modal */}
        {selectedPost && (
          <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
            <DialogContent className='max-w-5xl max-h-[90vh] overflow-y-auto p-0'>
              <div className='p-6 md:p-8'>
                <DialogHeader className='mb-6'>
                  <DialogTitle className='text-2xl md:text-3xl font-bold'>{selectedPost.title}</DialogTitle>
                </DialogHeader>

                <div className='space-y-8'>
                  {selectedPost.image && (
                    <img
                      src={selectedPost.image}
                      alt={selectedPost.title}
                      className='w-full h-64 md:h-80 object-cover rounded-xl shadow-md'
                    />
                  )}

                  <div className='prose prose-lg max-w-none dark:prose-invert'>
                    <QuillPreview html={selectedPost.content} className='entry-content' />
                  </div>

                  <div className='pt-6 border-t text-sm text-muted-foreground space-y-2'>
                    <p>
                      <strong>ID:</strong> {selectedPost.id}
                    </p>
                    <p>
                      <strong>Tác giả:</strong> {selectedPost.authorName}
                    </p>
                    <p>
                      <strong>Ngày gửi:</strong> {selectedPost.createdAt?.toDate().toLocaleString('vi-VN')}
                    </p>
                    {selectedPost.rejectReason && (
                      <p className='text-destructive'>
                        <strong>Lý do từ chối:</strong> {selectedPost.rejectReason}
                      </p>
                    )}
                    <div className='flex flex-wrap gap-2 mt-4'>
                      {selectedPost.tags?.map((tag) => (
                        <Badge key={tag} variant='secondary'>
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}

export default AdminPosts
