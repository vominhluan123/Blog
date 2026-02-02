import { type Post } from '@/firebase/db'
import { db } from '@/firebase/firebase-config'
import { collection, getDocs, limit, orderBy, query, Timestamp, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar'
import { Card, CardContent } from '../../ui/card'

interface Author {
  authorId: string
  authorName: string
  authorPhotoURL: string
  postCount: number
}
const RightSidebar = () => {
  const [hotByLikes, setHotByLikes] = useState<Post[]>([])
  const [hotByComments, setHotByComments] = useState<Post[]>([])
  const [topAuthors, setTopAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        const now = new Date()
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - 7)
        startOfWeek.setHours(0, 0, 0, 0)
        const startTs = Timestamp.fromDate(startOfWeek)

        // 1. Bài hot theo LIKE
        const qLikes = query(
          collection(db, 'posts'),
          where('createdAt', '>=', startTs),
          where('status', '==', 'Đã duyệt'),
          orderBy('createdAt'),
          orderBy('likesCount', 'desc'),
          limit(5)
        )
        const snapLikes = await getDocs(qLikes)
        setHotByLikes(snapLikes.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Post))

        // 2. Bài hot theo COMMENT
        const qComments = query(
          collection(db, 'posts'),
          where('createdAt', '>=', startTs),
          where('status', '==', 'Đã duyệt'),
          orderBy('createdAt'),
          orderBy('commentsCount', 'desc'),
          limit(5)
        )
        const snapComments = await getDocs(qComments)
        setHotByComments(snapComments.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Post))

        // 3. Tác giả nổi bật - đếm số bài theo authorId
        // Cách đơn giản: query tất cả posts Đã duyệt + group by authorId (Firestore không hỗ trợ group by native → ta fetch limited rồi aggregate client-side)
        // Nếu bạn có nhiều bài → nên duy trì collection riêng "authorStats" hoặc dùng Cloud Function để update counter
        const qAuthors = query(
          collection(db, 'posts'),
          where('status', '==', 'Đã duyệt'),
          limit(100) // giới hạn để tránh fetch quá nhiều, điều chỉnh nếu cần
        )
        const snapAuthors = await getDocs(qAuthors)

        const authorMap = new Map<string, Author>()
        snapAuthors.docs.forEach((doc) => {
          const data = doc.data()
          const authorId = data.authorId
          if (!authorId) return

          if (!authorMap.has(authorId)) {
            authorMap.set(authorId, {
              authorId,
              authorName: data.authorName || 'Unknown',
              authorPhotoURL: data.authorPhotoURL || '',
              postCount: 0
            })
          }
          const author = authorMap.get(authorId)!
          author.postCount += 1
        })

        // Sort và lấy top 3-5
        const sortedAuthors = Array.from(authorMap.values())
          .sort((a, b) => b.postCount - a.postCount)
          .slice(0, 5)

        setTopAuthors(sortedAuthors)
      } catch (error) {
        console.error('Lỗi fetch sidebar:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const renderList = (posts: Post[], title: string) => (
    <>
      <h4 className='text-lg font-semibold text-foreground mb-3'>{title}</h4>
      {posts.length === 0 ? (
        <p className='text-sm text-muted-foreground'>Chưa có dữ liệu</p>
      ) : (
        <ol className='space-y-4'>
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                to={`/post/${ post.id}`}
                className='block text-foreground hover:text-primary transition-colors font-medium'
              >
                {post.title}
              </Link>
              <p className='text-sm text-muted-foreground mt-1'>
                {post.likesCount} likes • {post.commentsCount} bình luận
              </p>
            </li>
          ))}
        </ol>
      )}
    </>
  )

  return (
    <aside className='hidden xl:block xl:col-span-3'>
      <div className='sticky top-24 space-y-6'>
        {/* Bài viết hot tuần */}
        <Card className='rounded-xl border bg-card shadow-sm'>
          <CardContent className='p-6'>
            <h3 className='text-h3 font-bold text-foreground mb-5'>Bài viết hot tuần</h3>

            {loading ? (
              <p className='text-sm text-muted-foreground'>Đang tải...</p>
            ) : (
              <div className='space-y-8'>
                {renderList(hotByLikes, 'Hot theo lượt thích')}
                {renderList(hotByComments, 'Hot theo bình luận')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tác giả nổi bật */}
        <Card className='rounded-xl border bg-card shadow-sm'>
          <CardContent className='p-6'>
            <h3 className='text-h3 font-bold text-foreground mb-5'>Tác giả nổi bật</h3>

            {loading ? (
              <p className='text-sm text-muted-foreground'>Đang tải...</p>
            ) : topAuthors.length === 0 ? (
              <p className='text-sm text-muted-foreground'>Chưa có tác giả nổi bật</p>
            ) : (
              <div className='space-y-4'>
                {topAuthors.map((author) => (
                  <div key={author.authorId} className='flex items-center gap-4'>
                    <Avatar className='h-12 w-12'>
                      <AvatarImage src={author.authorPhotoURL} alt={author.authorName} />
                      <AvatarFallback>{author.authorName?.slice(0, 2).toUpperCase() || '??'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className='font-semibold text-foreground'>{author.authorName}</p>
                      <p className='text-sm text-muted-foreground'>{author.postCount} bài viết</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </aside>
  )
}

export default RightSidebar
