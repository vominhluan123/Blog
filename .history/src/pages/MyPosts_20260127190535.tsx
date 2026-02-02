import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/useAuth'
import { type Post, POSTS_COLLECTION, PostStatus } from '@/firebase/db'
import { db } from '@/firebase/firebase-config'
import DOMPurify from 'dompurify'
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'

const MyPosts = () => {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')

  useEffect(() => {
    if (!user) return

    const fetchMyPosts = async () => {
      try {
        let q = query(collection(db, POSTS_COLLECTION), where('authorId', '==', user.uid))

        // Filter theo tab
        if (activeTab === PostStatus.PENDING) {
          q = query(q, where('status', '==', PostStatus.PENDING))
        } else if (activeTab === PostStatus.APPROVED) {
          q = query(q, where('status', '==', PostStatus.APPROVED))
        } else if (activeTab === PostStatus.REJECTED) {
          q = query(q, where('status', '==', PostStatus.REJECTED))
        }

        q = query(q, orderBy('createdAt', 'desc'))

        const snapshot = await getDocs(q)
        const postList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Post)
        setPosts(postList)
      } catch (error) {
        console.error('Lỗi lấy bài viết của tôi:', error)
        toast.error('Không thể tải danh sách bài viết')
      } finally {
        setLoading(false)
      }
    }

    fetchMyPosts()
  }, [user, activeTab])

  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <h1 className='text-3xl font-bold text-muted-foreground'>Vui lòng đăng nhập để xem bài viết của bạn</h1>
      </div>
    )
  }

  if (loading) {
    return (
      <div className='min-h-screen py-12 bg-background'>
        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
          <h1 className='text-3xl font-bold mb-8'>Bài viết của tôi</h1>
          <div className='space-y-6'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className='p-6'>
                  <div className='flex flex-col md:flex-row gap-6'>
                    <Skeleton className='md:w-1/3 h-48 rounded-lg' />
                    <div className='flex-1 space-y-4'>
                      <Skeleton className='h-8 w-3/4 rounded-lg' />
                      <div className='space-y-2'>
                        <Skeleton className='h-5 w-full rounded-md' />
                        <Skeleton className='h-5 w-full rounded-md' />
                      </div>
                      <Skeleton className='h-6 w-24 rounded-md' />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
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

        <Tabs defaultValue='pending' className='w-full'>
          <TabsList className='grid w-full grid-cols-3 mb-6'>
            <TabsTrigger value='pending'>
              Chờ duyệt ({posts.filter((p) => p.status === PostStatus.PENDING).length})
            </TabsTrigger>
            <TabsTrigger value='approved'>
              Đã duyệt ({posts.filter((p) => p.status === PostStatus.APPROVED).length})
            </TabsTrigger>
            <TabsTrigger value='rejected'>
              Huỷ ({posts.filter((p) => p.status === PostStatus.REJECTED).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value='pending'>
            <PostList posts={posts.filter((p) => p.status === PostStatus.PENDING)} />
          </TabsContent>
          <TabsContent value='approved'>
            <PostList posts={posts.filter((p) => p.status === PostStatus.APPROVED)} />
          </TabsContent>
          <TabsContent value='rejected'>
            <PostList posts={posts.filter((p) => p.status === PostStatus.REJECTED)} />
          </TabsContent>
        </Tabs>

        {posts.length === 0 && (
          <div className='text-center py-12 text-muted-foreground text-lg'>
            Bạn chưa có bài viết nào. Hãy viết bài mới nhé!
            <Button asChild className='mt-6'>
              <Link to='/write'>Viết bài mới</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Component nhỏ để render danh sách bài (dùng chung cho các tab)
const PostList = ({ posts }: { posts: Post[] }) => {
  if (posts.length === 0) {
    return <div className='text-center py-12 text-muted-foreground'>Không có bài viết nào trong danh mục này</div>
  }

  return (
    <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
      {posts.map((post) => (
        <Card key={post.id} className='overflow-hidden hover:shadow-lg transition-shadow'>
          {post.image && (
            <div className='aspect-video'>
              <img src={post.image} alt={post.title} className='w-full h-full object-cover' />
            </div>
          )}
          <CardContent className='p-6 space-y-4'>
            <div className='flex justify-between items-center'>
              <h3 className='text-lg font-bold line-clamp-2'>
                <Link to={`/post/${post.id}`} className='hover:text-primary transition-colors'>
                  {post.title}
                </Link>
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
                {post.status}
              </Badge>
            </div>
            <PostContentPreview
                             content={post.content}
                             maxLength={180}
                             className='text-muted-foreground mb-4 line-clamp-3 leading-relaxed'
                           />
            <div className='flex flex-wrap gap-2'>
              {post.tags?.slice(0, 3).map((tag) => (
                <Badge key={tag} variant='outline' className='text-xs'>
                  {tag}
                </Badge>
              ))}
            </div>
            <div className='text-xs text-muted-foreground'>{post.createdAt.toDate().toLocaleDateString()}</div>
            {post.status === PostStatus.REJECTED && (
              <div className='mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive'>
                <strong>Lý do từ chối:</strong>{' '}
                {post.rejectReason ? post.rejectReason : 'Không có lý do cụ thể từ admin'}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default MyPosts
