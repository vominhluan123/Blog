import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { type Post } from '@/firebase/db' // Import interface Post của bạn
import { db } from '@/firebase/firebase-config'
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import FullScreenSpinner from '../loading-button/FullScreenSpinner'
import { Badge } from '../ui/badge'

const MainFeed = () => {
  const [featuredPost, setFeaturedPost] = useState<Post | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Lấy bài nổi bật (ưu tiên 1 bài isFeatured = true)
        const featuredQuery = query(
          collection(db, 'posts'),
          where('status', '==', 'Đã duyệt'),
          where('isFeatured', '==', true),
          orderBy('createdAt', 'desc'),
          limit(1)
        )
        const featuredSnapshot = await getDocs(featuredQuery)
        if (!featuredSnapshot.empty) {
          const doc = featuredSnapshot.docs[0]
          setFeaturedPost({ id: doc.id, ...doc.data() } as Post)
        }

        // Lấy các bài còn lại (đã duyệt, không featured hoặc featured cũ)
        const postsQuery = query(
          collection(db, 'posts'),
          where('status', '==', 'Đã duyệt'),
          orderBy('createdAt', 'desc'),
          limit(10) // Tạm lấy 10 bài mới nhất
        )
        const postsSnapshot = await getDocs(postsQuery)
        const postList = postsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Post))
        setPosts(postList)
      } catch (error) {
        console.error('Lỗi lấy bài viết:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  if (loading) {
    return <FullScreenSpinner />
  }

  return (
    <section className='lg:col-span-6'>
      <h1 className='text-h1 font-extrabold mb-10 text-primary'>Blog Game - Tips, Review & Hướng dẫn</h1>

      {/* Hero - Bài nổi bật (nếu có) */}
      {featuredPost ? (
        <div className='mb-10 rounded-2xl bg-linear-to-r from-primary to-primary/80 p-8 text-primary-foreground overflow-hidden shadow-xl'>
          <div className='max-w-3xl'>
            <h2 className='text-h2 font-extrabold leading-tight'>{featuredPost.title}</h2>
            <p className='mt-4 text-primary-foreground/90 text-body line-clamp-3'>
              {featuredPost.content.substring(0, 200)}...
            </p>
            <div className='mt-6 flex items-center gap-4'>
              <Button variant='secondary' size='lg' asChild>
                <Link to={`/post/${featuredPost.id}`}>Đọc ngay</Link>
              </Button>
              <div className='text-sm opacity-80 flex items-center gap-2'>
                <Avatar className='h-8 w-8'>
                  <AvatarImage src={featuredPost.image || 'https://github.com/shadcn.png'} />
                  <AvatarFallback>{featuredPost.authorName?.[0] || 'A'}</AvatarFallback>
                </Avatar>
                <span>
                  {featuredPost.authorName} • {featuredPost.createdAt.toDate().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className='mb-10 rounded-2xl bg-muted p-8 text-center text-muted-foreground'>
          Chưa có bài viết nổi bật nào
        </div>
      )}

      {/* Danh sách bài viết */}
      <div className='space-y-6'>
        {posts.map((post) => (
          <article
            key={post.id}
            className='rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300'
          >
            <div className='flex flex-col md:flex-row gap-6'>
              {post.image && (
                <div className='md:w-1/3'>
                  <img src={post.image} alt={post.title} className='w-full h-48 object-cover rounded-lg' />
                </div>
              )}
              <div className='flex-1'>
                <h2 className='text-h3 font-bold text-foreground hover:text-primary transition-colors mb-3'>
                  <Link to={`/post/${post.id}`}>{post.title}</Link>
                </h2>
                <p className='text-body text-muted-foreground mb-4 line-clamp-3'>{post.content.substring(0, 200)}...</p>
                <div className='flex flex-wrap gap-2 mb-4'>
                  {post.tags?.map((tag) => (
                    <Badge key={tag} variant='secondary' className='text-xs'>
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className='flex items-center justify-between text-sm text-muted-foreground'>
                  <div className='flex items-center gap-3'>
                    <Avatar className='h-8 w-8'>
                      <AvatarImage src={post.image || 'https://github.com/shadcn.png'} />
                      <AvatarFallback>{post.authorName?.[0] || 'A'}</AvatarFallback>
                    </Avatar>
                    <span>
                      {post.authorName} • {post.createdAt.toDate().toLocaleDateString()}
                    </span>
                  </div>
                  <div className='flex gap-4'>
                    <button className='hover:text-primary transition-colors'>Like ({post.likesCount})</button>
                    <button className='hover:text-primary transition-colors'>Comment</button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {posts.length === 0 && (
        <div className='text-center py-12 text-muted-foreground text-lg'>Chưa có bài viết nào</div>
      )}
    </section>
  )
}

export default MainFeed
