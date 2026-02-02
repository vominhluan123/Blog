// ... imports giữ nguyên, thêm import nếu cần
import { POSTS_COLLECTION, PostStatus, type Post } from '@/firebase/db'
import { db } from '@/firebase/firebase-config'
import { collection, getDocs, limit, query, Timestamp, where } from 'firebase/firestore'
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
  const [hotPosts, setHotPosts] = useState<Post[]>([])
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

        // Fetch tất cả bài trong tuần (limit 50-100 để an toàn)
        const qAll = query(
          collection(db, POSTS_COLLECTION),
          where('createdAt', '>=', startTs),
          where('status', '==', PostStatus.APPROVED),
          limit(100)
        )

        const unsubscribe = onSnapshot(qAll, (snap) => {
          const allPosts = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Post)
          const sorted = allPosts
            .sort((a, b) => {
              const scoreA = (a.likesCount || 0) + (a.commentsCount || 0) * 2
              const scoreB = (b.likesCount || 0) + (b.commentsCount || 0) * 2
              return scoreB - scoreA
            })
            .slice(0, 5)
          setHotPosts(sorted)
        })


        // Sort client-side theo "hot" nhất: ưu tiên likesCount, nếu bằng thì commentsCount
        const sortedHot = allPostsThisWeek
          .sort((a, b) => {
            const scoreA = (a.likesCount || 0) + (a.commentsCount || 0) * 2 // comment "nặng" hơn like 2x
            const scoreB = (b.likesCount || 0) + (b.commentsCount || 0) * 2
            return scoreB - scoreA // desc
          })
          .slice(0, 5) // top 5

        setHotPosts(sortedHot)

        // Phần tác giả giữ nguyên
        const authorMap = new Map<string, Author>()
        allPostsThisWeek.forEach((post) => {
          // chỉ dùng bài tuần này cho tác giả nổi bật tuần, hoặc giữ như cũ nếu muốn all-time
          const authorId = post.authorId
          if (!authorId) return

          if (!authorMap.has(authorId)) {
            authorMap.set(authorId, {
              authorId,
              authorName: post.authorName || 'Unknown',
              authorPhotoURL: post.authorPhotoURL || '',
              postCount: 0
            })
          }
          authorMap.get(authorId)!.postCount += 1
        })

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

  const renderHotList = (posts: Post[]) => (
    <>
      {posts.length === 0 ? (
        <p className='text-sm text-muted-foreground'>Chưa có bài hot tuần này</p>
      ) : (
        <ol className='space-y-4'>
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                to={`/post/${post.id}`} // dùng id như bạn muốn
                className='block text-foreground hover:text-primary transition-colors font-medium'
              >
                {post.title}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </>
  )

  return (
    <aside className='hidden xl:block xl:col-span-3'>
      <div className='sticky top-24 space-y-6'>
        {/* Bài viết hot tuần - gộp 1 list */}
        <Card className='rounded-xl border bg-card shadow-sm'>
          <CardContent className='p-6'>
            <h3 className='text-h3 font-bold text-foreground mb-5'>Bài viết hot tuần</h3>

            {loading ? <p className='text-sm text-muted-foreground'>Đang tải...</p> : renderHotList(hotPosts)}
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
