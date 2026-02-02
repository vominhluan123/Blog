import { Button } from '@/components/ui/button'
import { type Post, POSTS_COLLECTION, PostStatus } from '@/firebase/db'
import { db } from '@/firebase/firebase-config'
import { collection, getDocs, limit, orderBy, query, Timestamp, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { doc, updateDoc } from 'firebase/firestore'
import { CheckCircle, Eye, XCircle } from 'lucide-react'
import { toast } from 'sonner'

const AdminPosts = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [rejectReason, setRejectReason] = useState('')
  const [category, setCategory] = useState('') // Danh mục khi duyệt
  const [isFeatured, setIsFeatured] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
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
  const categories = ['GameGuides', 'Esports', 'Review', 'Tips & Tricks']

  useEffect(() => {
    const fetchPendingPosts = async () => {
      try {
        setIsLoading(true)
        const q = query(
          collection(db, POSTS_COLLECTION),
          where('status', '==', PostStatus.PENDING),
          orderBy('createdAt', 'desc'),
          limit(20) // Tạm 20 bài
        )
        const snapshot = await getDocs(q)
        const postList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Post))
        setPosts(postList)
        setFilteredPosts(postList)
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
      await updateDoc(doc(db, 'posts', postId), {
        status: PostStatus.REJECTED,
        rejectReason, // Thêm trường lý do (tùy chọn)
        updatedAt: Timestamp.now()
      })
      toast.success('Bài viết đã bị huỷ!')
      setPosts(posts.filter((p) => p.id !== postId))
    } catch (error) {
      toast.error('Lỗi huỷ bài!')
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
              {filteredPosts.map((post) => (
                <TableRow key={post.id} className='hover:bg-muted/50 transition-colors'>
                  <TableCell className='font-medium'>{post.title}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredPosts.length === 0 && (
          <div className='text-center py-12 text-muted-foreground text-lg'>Chưa có bài viết nào chờ duyệt</div>
        )}

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
    </div>
  )
}

export default AdminPosts
