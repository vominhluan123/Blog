// ... imports giữ nguyên, thêm import nếu cần
import { POSTS_COLLECTION, PostStatus, type Post } from '@/firebase/db'
import { db } from '@/firebase/firebase-config'
import { createSlug } from '@/utils/slug'
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
  authorSlug?: string
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

        const snap = await getDocs(qAll)
        const allPostsThisWeek = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })) as Post[]

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
              postCount: 0,
              authorSlug: slu
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

  return (
    <aside className='hidden xl:block xl:col-span-3'>
      <div className='sticky top-24 space-y-6'>
        <Card className='rounded-2xl border bg-card/80 backdrop-blur-sm shadow-md overflow-hidden'>
          <CardContent className='p-6'>
            <div className='flex items-center gap-2 mb-5'>
              <span className='text-2xl'>🔥</span>
              <h3 className='text-h3 font-bold text-foreground tracking-tight'>Bài viết hot tuần</h3>
            </div>
            {loading ? (
              <div className='space-y-3'>
                <div className='h-5 bg-muted rounded animate-pulse' />
                <div className='h-5 bg-muted rounded animate-pulse w-4/5' />
                <div className='h-5 bg-muted rounded animate-pulse w-3/5' />
              </div>
            ) : hotPosts.length === 0 ? (
              <p className='text-sm text-muted-foreground italic py-2'>
                Tuần này chưa có bài hot nào... bạn là người đầu tiên 🔥?
              </p>
            ) : (
              <ol className='space-y-4'>
                {hotPosts.map((post, index) => (
                  <li key={post.id}>
                    <Link
                      to={`/post/${post.id}`}
                      className='group flex items-start gap-3 hover:bg-accent/40 transition-all duration-200 rounded-lg p-2 -mx-2'
                    >
                      <div
                        className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0
                            ? 'bg-primary text-primary-foreground'
                            : index === 1
                              ? 'bg-orange-500/90 text-white'
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {index + 1}
                      </div>

                      <div className='flex-1 min-w-0'>
                        <p className='font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2'>
                          {post.title}
                        </p>
                        {/* Nếu muốn thêm hint nhỏ (tùy chọn) */}
                        {/* <p className="text-xs text-muted-foreground mt-0.5">
                      {post.likesCount || 0} likes • {post.commentsCount || 0} bình luận
                    </p> */}
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card className='rounded-2xl border bg-card/80 backdrop-blur-sm shadow-md overflow-hidden'>
          <CardContent className='p-6'>
            <h3 className='text-h3 font-bold text-foreground mb-5'>Tác giả nổi bật</h3>

            {loading ? (
              <div className='space-y-4'>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className='flex items-center gap-4'>
                    <div className='h-12 w-12 rounded-full bg-muted animate-pulse' />
                    <div className='space-y-2 flex-1'>
                      <div className='h-5 bg-muted rounded animate-pulse w-3/4' />
                      <div className='h-4 bg-muted rounded animate-pulse w-1/2' />
                    </div>
                  </div>
                ))}
              </div>
            ) : topAuthors.length === 0 ? (
              <p className='text-sm text-muted-foreground italic'>
                Chưa có tác giả nào nổi bật... bạn sẽ là người đầu tiên?
              </p>
            ) : (
              <div className='space-y-5'>
                {topAuthors.map((author) => {
                  const slug = author.authorSlug || createSlug(author.authorName)
                  return (
                    <Link key={author.authorId} to={`/author/${slug}`} className='block'>
                      <div className='flex items-center gap-4 group hover:bg-accent/30 transition-colors rounded-lg p-2 -mx-2'>
                        <Avatar className='h-12 w-12 border-2 border-background shadow-sm group-hover:shadow-md transition-shadow'>
                          <AvatarImage src={author.authorPhotoURL} alt={author.authorName} />
                          <AvatarFallback className='bg-primary/10 text-primary'>
                            {author.authorName?.slice(0, 2).toUpperCase() || '??'}
                          </AvatarFallback>
                        </Avatar>
                        <div className='flex-1 min-w-0'>
                          <p className='font-semibold text-foreground truncate group-hover:text-primary transition-colors'>
                            {author.authorName}
                          </p>
                          <p className='text-sm text-muted-foreground'>{author.postCount} bài viết</p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </aside>
  )
}

export default RightSidebar
