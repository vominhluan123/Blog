// CategoryPage.tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { POSTS_COLLECTION, slugToCategoryName, type Post } from '@/firebase/db'
import { db } from '@/firebase/firebase-config'
import { useTitle } from '@/hooks/useTitle'
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router' // ← sửa thành react-router-dom

const CategoryPage = () => {
  const { category: slug } = useParams<{ category: string }>()
  const categoryName = slugToCategoryName[slug || ''] || 'Danh mục'

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useTitle(`${categoryName} • Blog Game`)

  useEffect(() => {
    const fetchCategoryPosts = async () => {
      if (!slug) {
        setLoading(false)
        return
      }

      const realCategoryName = slugToCategoryName[slug]

      if (!realCategoryName) {
        setPosts([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        const q = query(
          collection(db, POSTS_COLLECTION),
          where('category', '==', realCategoryName), // ← Dùng tên tiếng Việt thật
          where('status', '==', 'Đã duyệt'), // ← Status đúng
          orderBy('createdAt', 'desc'),
          limit(12)
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
  }, [slug])

  // Loading skeleton (giống MainFeed)
  if (loading) {
    return (
      <div className='space-y-10'>
        <h1 className='text-4xl md:text-5xl font-extrabold text-primary tracking-tight'>{categoryName}</h1>
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
                    <Skeleton className='h-6 w-20 rounded-md' />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-10'>
      <h1 className='text-4xl md:text-5xl font-extrabold text-primary tracking-tight'>{categoryName}</h1>

      {posts.length === 0 ? (
        <div className='text-center py-20 text-muted-foreground text-lg'>Chưa có bài viết nào trong danh mục này.</div>
      ) : (
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
                  <h2 className='text-2xl font-bold text-foreground hover:text-primary transition-colors mb-3'>
                    <Link to={`/post/${post.id}`}>{post.title}</Link>
                  </h2>
                  <p className='text-muted-foreground mb-4 line-clamp-3'>{post.content.substring(0, 200)}...</p>
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
                        {post.authorName} • {post.createdAt.toDate().toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <div className='flex gap-4'>
                      <span>Like ({post.likesCount || 0})</span>
                      <span>Comment ({post.commentsCount || 0})</span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default CategoryPage
