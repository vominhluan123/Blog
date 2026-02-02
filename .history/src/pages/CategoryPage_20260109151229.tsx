// CategoryPage.tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { POSTS_COLLECTION, type Post } from '@/firebase/db'
import { db } from '@/firebase/firebase-config'
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'

const CategoryPage = () => {
  const { category } = useParams<{ category: string }>()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategoryPosts = async () => {
      if (!category) return

      try {
        const q = query(
          collection(db, POSTS_COLLECTION),
          where('category', '==', category), // ← field category trong Post
          where('status', '==', 'Đã duyệt'),
          orderBy('createdAt', 'desc')
          // limit(12) // tuỳ bạn
        )

        const snapshot = await getDocs(q)
        const postList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })) as Post[]

        setPosts(postList)
      } catch (err) {
        console.error('Lỗi lấy bài theo danh mục:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCategoryPosts()
  }, [category])

  if (loading) {
    return (
      <section className='lg:col-span-6'>
        <h1 className='text-h1 font-extrabold mb-10 text-primary'>Blog Game - Tips, Review & Hướng dẫn</h1>

        {/* Skeleton Hero */}
        <div className='mb-10 rounded-2xl bg-linear-to-r from-primary/20 to-primary/10 p-8 overflow-hidden shadow-xl'>
          <div className='max-w-3xl space-y-6'>
            <Skeleton className='h-12 w-3/4 rounded-lg' />
            <Skeleton className='h-6 w-full rounded-md' />
            <Skeleton className='h-6 w-2/3 rounded-md' />
            <div className='mt-6 flex items-center gap-4'>
              <Skeleton className='h-10 w-32 rounded-md' />
              <div className='flex items-center gap-2'>
                <Skeleton className='h-8 w-8 rounded-full' />
                <Skeleton className='h-5 w-40 rounded-md' />
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton danh sách bài viết */}
        <div className='space-y-6'>
          {Array.from({ length: 6 }).map((_, i) => (
            <article key={i} className='rounded-xl border bg-card p-6 shadow-sm'>
              <div className='flex flex-col md:flex-row gap-6'>
                <Skeleton className='md:w-1/3 h-48 rounded-lg' />
                <div className='flex-1 space-y-4'>
                  <Skeleton className='h-8 w-3/4 rounded-lg' />
                  <div className='space-y-2'>
                    <Skeleton className='h-5 w-full rounded-md' />
                    <Skeleton className='h-5 w-full rounded-md' />
                    <Skeleton className='h-5 w-2/3 rounded-md' />
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    <Skeleton className='h-6 w-16 rounded-md' />
                    <Skeleton className='h-6 w-16 rounded-md' />
                    <Skeleton className='h-6 w-16 rounded-md' />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <Skeleton className='h-8 w-8 rounded-full' />
                      <Skeleton className='h-5 w-32 rounded-md' />
                    </div>
                    <div className='flex gap-4'>
                      <Skeleton className='h-5 w-16 rounded-md' />
                      <Skeleton className='h-5 w-16 rounded-md' />
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className='lg:col-span-6'>
      <h1 className='text-h1 font-extrabold mb-10 text-primary'>Blog Game - Tips, Review & Hướng dẫn</h1>

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
                      <AvatarImage src={post.authorPhotoURL || 'https://github.com/shadcn.png'} />
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
export default CategoryPage
