import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar'
import { Card, CardContent } from '../../ui/card'
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/firebase/firebase-config'

const RightSidebar = () => {
  const [hotPosts, setHotPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHotPosts = async () => {
      try {
        setLoading(true)

        // Lấy thời điểm đầu tuần (7 ngày trước)
        const now = new Date()
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - 7)
        startOfWeek.setHours(0, 0, 0, 0)

        const startTimestamp = Timestamp.fromDate(startOfWeek)

        // Query: bài viết trong tuần, sắp xếp theo likesCount giảm dần
        // Bạn có thể thay bằng commentsCount hoặc kết hợp (ví dụ: likesCount + commentsCount * 2)
        const postsQuery = query(
          collection(db, 'posts'),
          where('createdAt', '>=', startTimestamp),
          orderBy('likesCount', 'desc'), // hoặc 'commentsCount'
          limit(5) // lấy top 5 cho sidebar
        )

        const snapshot = await getDocs(postsQuery)
        const posts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }))

        setHotPosts(posts)
      } catch (error) {
        console.error('Lỗi khi lấy bài hot:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHotPosts()
  }, [])

  return (
    <aside className='hidden xl:block xl:col-span-3'>
      <div className='sticky top-24 space-y-6'>
        {/* Bài viết hot tuần */}
        <Card className='rounded-xl border bg-card shadow-sm'>
          <CardContent className='p-6'>
            <h3 className='text-h3 font-bold text-foreground mb-5'>Bài viết hot tuần</h3>

            {loading ? (
              <p className='text-sm text-muted-foreground'>Đang tải...</p>
            ) : hotPosts.length === 0 ? (
              <p className='text-sm text-muted-foreground'>Chưa có bài viết hot tuần này</p>
            ) : (
              <ol className='space-y-4'>
                {hotPosts.map((post) => (
                  <li key={post.id}>
                    <Link
                      to={`/post/${post.id}`} // hoặc post.slug nếu bạn dùng slug
                      className='block text-foreground hover:text-primary transition-colors font-medium'
                    >
                      {post.title || 'Bài viết không có tiêu đề'}
                    </Link>
                    <p className='text-sm text-muted-foreground mt-1'>
                      {post.likesCount || 0} likes • {post.commentsCount || 0} bình luận
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Tác giả nổi bật - giữ nguyên hoặc làm động tương tự nếu cần */}
        <Card className='rounded-xl border bg-card shadow-sm'>
          <CardContent className='p-6'>
            <h3 className='text-h3 font-bold text-foreground mb-5'>Tác giả nổi bật</h3>
            <div className='space-y-4'>
              {/* giữ nguyên phần này, hoặc fetch động từ collection users/authors */}
              <div className='flex items-center gap-4'>
                <Avatar className='h-12 w-12'>
                  <AvatarImage src='https://github.com/shadcn.png' alt='Author Name' />
                  <AvatarFallback>AN</AvatarFallback>
                </Avatar>
                <div>
                  <p className='font-semibold text-foreground'>Vũ "ProGamer" Nguyễn</p>
                  <p className='text-sm text-muted-foreground'>Master Jungler • 50 bài viết</p>
                </div>
              </div>

              <div className='flex items-center gap-4'>
                <Avatar className='h-12 w-12'>
                  <AvatarImage src='https://github.com/shadcn.png' alt='Another Author' />
                  <AvatarFallback>TA</AvatarFallback>
                </Avatar>
                <div>
                  <p className='font-semibold text-foreground'>Minh Esports</p>
                  <p className='text-sm text-muted-foreground'>Phân tích giải đấu • 32 bài</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </aside>
  )
}

export default RightSidebar
