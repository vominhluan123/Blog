// src/pages/AuthorProfilePage.tsx (hoặc đặt ở đâu tùy bạn)
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { POSTS_COLLECTION, PostStatus, type Post } from '@/firebase/db'
import { db } from '@/firebase/firebase-config'
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'

const AuthorProfilePage = () => {
  const { authorId } = useParams<{ authorId: string }>()
  const [posts, setPosts] = useState<Post[]>([])
  const [authorInfo, setAuthorInfo] = useState<{
    name: string
    photoURL?: string
    postCount: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authorId) return

    const fetchAuthorPosts = async () => {
      try {
        setLoading(true)

        // Query tất cả bài APPROVED của tác giả này, sắp xếp mới nhất trước
        const q = query(
          collection(db, POSTS_COLLECTION),
          where('authorId', '==', authorId),
          where('status', '==', PostStatus.APPROVED),
          orderBy('createdAt', 'desc')
          // limit(20) // bạn có thể thêm limit + pagination sau
        )

        const snap = await getDocs(q)
        const authorPosts = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })) as Post[]

        setPosts(authorPosts)

        // Lấy thông tin tác giả từ bài viết đầu tiên (vì đã lưu authorName, authorPhotoURL)
        if (authorPosts.length > 0) {
          const firstPost = authorPosts[0]
          setAuthorInfo({
            name: firstPost.authorName || 'Unknown',
            photoURL: firstPost.authorPhotoURL,
            postCount: authorPosts.length
          })
        } else {
          // Trường hợp hiếm: tác giả chưa có bài approved nào
          setAuthorInfo({
            name: 'Tác giả này',
            postCount: 0
          })
        }
      } catch (err) {
        console.error('Lỗi khi lấy bài viết của tác giả:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAuthorPosts()
  }, [authorId])

  return (
    <div className='container mx-auto py-8 px-4 max-w-4xl'>
      {/* Phần header tác giả */}
      {authorInfo && (
        <div className='flex items-center gap-6 mb-10 bg-card p-6 rounded-2xl shadow-sm border'>
          <Avatar className='h-20 w-20 border-4 border-background shadow-md'>
            <AvatarImage src={authorInfo.photoURL} alt={authorInfo.name} />
            <AvatarFallback className='text-2xl bg-primary/10 text-primary'>
              {authorInfo.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div>
            <h1 className='text-3xl font-bold'>{authorInfo.name}</h1>
            <p className='text-lg text-muted-foreground mt-1'>{authorInfo.postCount} bài viết</p>
          </div>
        </div>
      )}

      <h2 className='text-2xl font-bold mb-6'>Bài viết của tác giả</h2>

      {loading ? (
        <div className='space-y-4'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='h-32 bg-muted rounded-xl animate-pulse' />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className='text-center py-12 text-muted-foreground'>Tác giả này chưa có bài viết nào được duyệt.</div>
      ) : (
        <div className='space-y-6'>
          {posts.map((post) => (
            <Link key={post.id} to={`/post/${post.id}`} className='block group'>
              <Card className='overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1'>
                <CardContent className='p-0'>
                  {post.image && <img src={post.image} alt={post.title} className='w-full h-48 object-cover' />}
                  <div className='p-6'>
                    <h3 className='text-xl font-semibold group-hover:text-primary transition-colors'>{post.title}</h3>
                    <div className='mt-3 flex items-center gap-4 text-sm text-muted-foreground'>
                      <span>{new Date(post.createdAt.seconds * 1000).toLocaleDateString('vi-VN')}</span>
                      <span>•</span>
                      <span>{post.likesCount || 0} thích</span>
                      <span>•</span>
                      <span>{post.commentsCount || 0} bình luận</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default AuthorProfilePage
