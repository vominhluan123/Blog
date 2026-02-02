import { Button } from '@/components/ui/button'
import { type Post, PostStatus } from '@/firebase/db'
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
import { toast } from 'sonner'

const AdminPosts = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [category, setCategory] = useState('') // Danh mục khi duyệt
  const formInputClass = cn(
    ' rounded-md border  py-6',
    'bg-background/80 text-foreground placeholder-muted-foreground/70',
    'transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-background backdrop-blur-sm',
    'dark:bg-background/50 dark:border-primary/20',
    'dark:focus:ring-primary/70 dark:focus:shadow-lg dark:focus:shadow-primary/30'
  )
  // Danh sách category cố định (admin quản lý)
  const categories = ['GameGuides', 'Esports', 'Review', 'Tips & Tricks']

  useEffect(() => {
    const fetchPendingPosts = async () => {
      try {
        const q = query(
          collection(db, 'posts'),
          where('status', '==', PostStatus.PENDING),
          orderBy('createdAt', 'desc'),
          limit(20) // Tạm 20 bài
        )
        const snapshot = await getDocs(q)
        const postList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Post))
        setPosts(postList)
      } catch (error) {
        console.error('Lỗi lấy bài chờ duyệt:', error)
        toast.error('Không thể tải danh sách bài!')
      } finally {
        setLoading(false)
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
      await updateDoc(doc(db, 'posts', postId), {
        status: PostStatus.APPROVED,
        category,
        updatedAt: Timestamp.now()
      })
      toast.success('Bài viết đã được duyệt!')
      setPosts(posts.filter((p) => p.id !== postId)) // Xóa khỏi danh sách chờ
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

        <div className='flex justify-between items-center mb-6'>
          <Input placeholder='Tìm theo tiêu đề hoặc tác giả...' className={cn(formInputClass, 'max-w-sm')} />
          <div className='space-x-4'>
            <Button>Đã duyệt</Button>
            <Button variant='destructive'>Huỷ</Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Tác giả</TableHead>
              <TableHead>Ngày gửi</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className='font-medium'>{post.title}</TableCell>
                <TableCell>{post.authorName}</TableCell>
                <TableCell>{post.createdAt.toDate().toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className='flex flex-wrap gap-1'>
                    {post.tags?.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant='secondary'>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className='flex gap-2'>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size='sm' variant='default'>
                        Duyệt
                      </Button>
                    </DialogTrigger>
                    <DialogContent className='sm:max-w-md '>
                      <DialogHeader>
                        <DialogTitle className='text-xl font-bold'>Chọn danh mục cho bài viết</DialogTitle>
                      </DialogHeader>
                      <div className='space-y-6 py-4'>
                        <div className='space-y-2'>
                          <Label htmlFor='category' className='text-base font-medium'>
                            Danh mục
                          </Label>
                          <Select onValueChange={setCategory} defaultValue={category}>
                            <SelectTrigger className='w-full'>
                              <SelectValue placeholder='Chọn danh mục...' className='bg-red-500' />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className='flex justify-end gap-3'>
                          <Button variant='destructive' onClick={() => setCategory('')}>
                            Hủy
                          </Button>
                          <Button
                            onClick={() => handleApprove(post.id)}
                            disabled={!category}
                            className='bg-primary hover:bg-primary/90'
                          >
                            Xác nhận duyệt
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant='destructive' size='sm'>
                        Huỷ
                      </Button>
                    </DialogTrigger>
                    <DialogContent className='sm:max-w-md bg-card text-card-foreground'>
                      <DialogHeader>
                        <DialogTitle>Huỷ bài viết</DialogTitle>
                      </DialogHeader>
                      <div className='grid flex-1 gap-2 space-y-2'>
                        <Label>Lý do huỷ</Label>
                        <Textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder='Nhập lý do...'
                          className={cn(formInputClass, ' resize-none')}
                        />
                        <Button variant='destructive' onClick={() => handleReject(post.id)}>
                          Xác nhận huỷ
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {posts.length === 0 && (
          <div className='text-center py-12 text-muted-foreground'>Chưa có bài viết nào chờ duyệt</div>
        )}
      </div>
    </div>
  )
}

export default AdminPosts
