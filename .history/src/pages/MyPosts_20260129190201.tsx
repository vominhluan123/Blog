import { PostContentPreview } from '@/components/PostContentPreview'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/useAuth'
import { type Post, POSTS_COLLECTION, PostStatus } from '@/firebase/db'
import { db } from '@/firebase/firebase-config'
import {
  Timestamp,
  collection,
  doc,
  getCountFromServer,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where
} from 'firebase/firestore'
import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'

const MyPosts = () => {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0
  })
  const [activeTab, setActiveTab] = useState<string>(PostStatus.PENDING)

  const fetchCounts = async () => {
    if (!user) return
    try {
      const baseQuery = query(collection(db, POSTS_COLLECTION), where('authorId', '==', user.uid))

      const [pendingSnap, approvedSnap, rejectedSnap] = await Promise.all([
        getCountFromServer(query(baseQuery, where('status', '==', PostStatus.PENDING))),
        getCountFromServer(query(baseQuery, where('status', '==', PostStatus.APPROVED))),
        getCountFromServer(query(baseQuery, where('status', '==', PostStatus.REJECTED)))
      ])

      setCounts({
        pending: pendingSnap.data().count,
        approved: approvedSnap.data().count,
        rejected: rejectedSnap.data().count
      })
    } catch (err) {
      console.error('Lỗi fetch count:', err)
    }
  }

  // Fetch danh sách bài theo tab hiện tại
  const fetchPosts = async () => {
    if (!user) return
    setLoading(true)
    try {
      let q = query(
        collection(db, POSTS_COLLECTION),
        where('authorId', '==', user.uid),
        where('status', '==', activeTab),
        orderBy('createdAt', 'desc')
      )

      const snapshot = await getDocs(q)
      const postList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Post)
      setPosts(postList)
    } catch (error) {
      console.error('Lỗi lấy bài viết:', error)
      toast.error('Không thể tải danh sách bài viết')
    } finally {
      setLoading(false)
    }
  }

  // Chạy khi mount + khi đổi tab + khi xóa bài
  useEffect(() => {
    fetchCounts()
  }, [user])

  useEffect(() => {
    fetchPosts()
  }, [user, activeTab])

  // Hàm xóa bài (soft delete)
  const handleDelete = async (postId: string) => {
    try {
      await updateDoc(doc(db, POSTS_COLLECTION, postId), {
        isDeleted: true,
        deletedAt: Timestamp.now(),
        status: PostStatus.DELETED // optional: thêm status mới nếu muốn
      })

      toast.success('Bài viết đã được xóa!', {
        description: 'Bạn có thể khôi phục sau nếu cần (liên hệ admin).'
      })

      // Cập nhật lại list và count
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      fetchCounts() // cập nhật số lượng trên tab
    } catch (err) {
      console.error('Lỗi xóa bài:', err)
      toast.error('Không thể xóa bài viết')
    }
  }

  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <h1 className='text-3xl font-bold text-muted-foreground'>Vui lòng đăng nhập để xem bài viết của bạn</h1>
      </div>
    )
  }

  return (
    <div className='min-h-screen py-12 bg-background'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4'>
          <h1 className='text-3xl font-bold'>Bài viết của tôi</h1>
          <Button asChild>
            <Link to='/write'>Viết bài mới</Link>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full grid-cols-3 mb-6'>
            <TabsTrigger value={PostStatus.PENDING}>Chờ duyệt ({counts.pending})</TabsTrigger>
            <TabsTrigger value={PostStatus.APPROVED}>Đã duyệt ({counts.approved})</TabsTrigger>
            <TabsTrigger value={PostStatus.REJECTED}>Bị huỷ ({counts.rejected})</TabsTrigger>
          </TabsList>

          {loading ? (
            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className='p-6'>
                    <Skeleton className='aspect-video w-full rounded-lg mb-4' />
                    <Skeleton className='h-6 w-3/4 mb-2' />
                    <Skeleton className='h-4 w-full' />
                    <Skeleton className='h-4 w-2/3' />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <TabsContent value={PostStatus.PENDING}>
                <PostList posts={posts} activeTab={activeTab} onDelete={handleDelete} />
              </TabsContent>
              <TabsContent value={PostStatus.APPROVED}>
                <PostList posts={posts} activeTab={activeTab} onDelete={handleDelete} />
              </TabsContent>
              <TabsContent value={PostStatus.REJECTED}>
                <PostList posts={posts} activeTab={activeTab} onDelete={handleDelete} />
              </TabsContent>
            </>
          )}
        </Tabs>

        {!loading && posts.length === 0 && (
          <div className='text-center py-20 text-muted-foreground text-lg'>
            <p>Bạn chưa có bài viết nào trong mục này.</p>
            <Button asChild className='mt-6'>
              <Link to='/write'>Viết bài đầu tiên ngay!</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// PostList component với nút Xóa
const PostList = ({
  posts,
  activeTab,
  onDelete
}: {
  posts: Post[]
  activeTab: string
  onDelete: (postId: string) => void
}) => {
  if (posts.length === 0) {
    return <div className='text-center py-12 text-muted-foreground'>Không có bài viết nào ở đây</div>
  }

  const canDelete = activeTab === PostStatus.PENDING || activeTab === PostStatus.REJECTED

  return (
    <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
      {posts.map((post) => (
        <Card key={post.id} className='overflow-hidden hover:shadow-lg transition-shadow relative group'>
          {post.image && (
            <div className='aspect-video'>
              <img src={post.image} alt={post.title} className='w-full h-full object-cover' />
            </div>
          )}
          <CardContent className='p-6 space-y-4'>
            <div className='flex justify-between items-start'>
              <h3 className='text-lg font-bold line-clamp-2 flex-1 pr-2'>
                <span className='hover:text-primary transition-colors'>{post.title}</span>
              </h3>
              <Badge
                variant={
                  post.status === PostStatus.APPROVED
                    ? 'default'
                    : post.status === PostStatus.PENDING
                      ? 'secondary'
                      : 'destructive'
                }
              >
                {post.status === 'Đang chờ duyệt' ? 'Chờ duyệt' : post.status === 'Đã duyệt' ? 'Đã duyệt' : 'Bị huỷ'}
              </Badge>
            </div>

            <PostContentPreview content={post.content} maxLength={180} className='text-muted-foreground line-clamp-3' />

            <div className='flex flex-wrap gap-2'>
              {post.tags?.slice(0, 3).map((tag) => (
                <Badge key={tag} variant='outline' className='text-xs'>
                  {tag}
                </Badge>
              ))}
            </div>

            <div className='text-xs text-muted-foreground'>{post.createdAt.toDate().toLocaleDateString('vi-VN')}</div>

            {/* Lý do từ chối */}
            {post.status === PostStatus.REJECTED && post.rejectReason && (
              <div className='p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive'>
                <strong>Lý do:</strong> {post.rejectReason}
              </div>
            )}

            {/* Hành động */}
            <div className='flex flex-wrap gap-2 pt-3 border-t'>
              {post.status === PostStatus.REJECTED && (
                <Button size='sm' variant='default' asChild>
                  <Link to={`/write?edit=${post.id}`}>Sửa & Gửi lại</Link>
                </Button>
              )}

              {post.status === PostStatus.PENDING && (
                <Button size='sm' variant='outline' asChild>
                  <Link to={`/write?edit=${post.id}`}>Chỉnh sửa</Link>
                </Button>
              )}

              {canDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size='sm' variant='destructive' className='gap-1'>
                      <Trash2 className='h-4 w-4' />
                      Xóa
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Xóa bài viết này?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bài viết sẽ bị ẩn khỏi danh sách và không thể khôi phục tự động.
                        <br />
                        <strong>{post.title}</strong>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(post.id)} className='bg-destructive'>
                        Xóa vĩnh viễn
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default MyPosts
