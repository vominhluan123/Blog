// RightSidebar.tsx
import { POSTS_COLLECTION, PostStatus, type Post } from '@/firebase/db'
import { db } from '@/firebase/firebase-config'
import { collection, getDocs, limit, query, Timestamp, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Link } from 'react-router' 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar' // điều chỉnh path nếu cần
import { Card, CardContent } from '@/components/ui/card'
import { createSlug } from '@/utils/slug'

interface Author {
  authorId: string
  authorName: string
  authorPhotoURL: string
  postCount: number
  authorSlug?: string // có thể không cần lưu, ta generate khi cần
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
        startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)) // đầu tuần (thứ 2)
        startOfWeek.setHours(0, 0, 0, 0)
        const startTs = Timestamp.fromDate(startOfWeek)

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

        const sortedHot = allPostsThisWeek
          .sort((a, b) => {
            const scoreA = (a.likesCount || 0) + (a.commentsCount || 0) * 2
            const scoreB = (b.likesCount || 0) + (b.commentsCount || 0) * 2
            return scoreB - scoreA
          })
          .slice(0, 5)

        setHotPosts(sortedHot)

        // Tác giả nổi bật
        const authorMap = new Map<string, Author>()
        allPostsThisWeek.forEach((post) => {
          const authorId = post.authorId
          if (!authorId) return

          if (!authorMap.has(authorId)) {
            authorMap.set(authorId, {
              authorId,
              authorName: post.authorName || 'Unknown',
              authorPhotoURL: post.authorPhotoURL || '',
              postCount: 0
              // authorSlug: post.authorSlug,  // nếu bạn lưu slug vào Post thì dùng, còn không thì generate
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
        {/* Phần hot posts giữ nguyên... */}

        {/* Tác giả nổi bật */}
        <Card className='rounded-2xl border bg-card/80 backdrop-blur-sm shadow-md overflow-hidden'>
          <CardContent className='p-6'>
            <h3 className='text-h3 font-bold text-foreground mb-5'>Tác giả nổi bật</h3>

            {loading ? (
              // skeleton giữ nguyên
              <div className='space-y-4'>{/* ... */}</div>
            ) : topAuthors.length === 0 ? (
              <p className='text-sm text-muted-foreground italic'>
                Chưa có tác giả nào nổi bật... bạn sẽ là người đầu tiên?
              </p>
            ) : (
              <div className='space-y-5'>
                {topAuthors.map((author) => {
                  const slug = createSlug(author.authorName)
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
