import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { POSTS_COLLECTION, PostStatus, type Post } from '@/firebase/db' // Import interface Post của bạn
import { db } from '@/firebase/firebase-config'
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
  where,
  type DocumentData
} from 'firebase/firestore'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Badge } from '../../ui/badge'
import { Skeleton } from '../../ui/skeleton'

const PAGE_SIZE = 2 // Số bài load mỗi lần
const LOAD_DELAY_MS = 600 // delay giả lập khi load thêm (có thể điều chỉnh 400-1000ms)
const MainFeed = () => {
  const [featuredPost, setFeaturedPost] = useState<Post | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const observerTarget = useRef<HTMLDivElement>(null)

  // Load featured + batch đầu tiên
  useEffect(() => {
    const fetchInitialPosts = async () => {
      try {
        // 1. Lấy bài nổi bật
        const featuredQuery = query(
          collection(db, POSTS_COLLECTION),
          where('status', '==', PostStatus.APPROVED),
          where('isFeatured', '==', true),
          orderBy('createdAt', 'desc'),
          limit(1)
        )
        const featuredSnap = await getDocs(featuredQuery)
        if (!featuredSnap.empty) {
          const doc = featuredSnap.docs[0]
          setFeaturedPost({ id: doc.id, ...doc.data() } as Post)
        }

        // 2. Lấy batch đầu tiên (3 bài)
        await fetchMorePosts(true) // true = là lần load đầu
      } catch (error) {
        console.error('Lỗi lấy bài viết ban đầu:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialPosts()
  }, [])

  // Hàm load thêm bài (có thể gọi lại nhiều lần)
  const fetchMorePosts = async (isInitial = false) => {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)

    try {
      // Delay giả lập để UX mượt hơn
      await new Promise((resolve) => setTimeout(resolve, isInitial ? 300 : LOAD_DELAY_MS))
      let q = query(
        collection(db, POSTS_COLLECTION),
        where('status', '==', PostStatus.APPROVED), // sửa lại thành PostStatus.APPROVED cho đồng bộ
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE)
      )

      // Nếu không phải lần đầu → bắt đầu từ document cuối cùng trước đó
      if (!isInitial && lastDoc) {
        q = query(q, startAfter(lastDoc))
      }

      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        setHasMore(false)
        return
      }

      const newPosts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Post)

      setPosts((prev) => (isInitial ? newPosts : [...prev, ...newPosts]))
      setLastDoc(snapshot.docs[snapshot.docs.length - 1])

      // Nếu load về ít hơn PAGE_SIZE → hết dữ liệu
      if (snapshot.docs.length < PAGE_SIZE) {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Lỗi load thêm bài viết:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  // Phát hiện scroll gần cuối trang
  useEffect(() => {
    const handleScroll = () => {
      if (loading || loadingMore || !hasMore || !observerTarget.current) return

      const bottom = Math.ceil(window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 200

      if (bottom) {
        fetchMorePosts()
      }
    }

    window.addEventListener('scroll', handleScroll)
    // Check ngay lần đầu nếu trang ngắn
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastDoc, loadingMore, hasMore, loading])
  // Gọi lần đầu khi mount (nếu muốn dùng ref thay vì scroll event)
  useEffect(() => {
    if (observerTarget.current && posts.length > 0 && hasMore) {
      const rect = observerTarget.current.getBoundingClientRect()
      if (rect.top <= window.innerHeight) {
        fetchMorePosts()
      }
    }
  }, [posts])

  if (loading) {
    return (
      <section className='lg:col-span-6'>
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
      {/* Hero - Bài nổi bật (nếu có) */}
      {featuredPost ? (
        <div className='relative mb-12 overflow-hidden rounded-3xl shadow-2xl h-[50vh] min-h-[400px] md:h-[60vh] lg:h-[70vh] group'>
          {/* Background Image hoặc Gradient */}
          <div className='absolute inset-0 transition-transform duration-700 group-hover:scale-105 origin-center'>
            {featuredPost.image ? (
              <div className="aspect-[4/3] w-full">
                
              </div>
              <img
                src={featuredPost.image}
                alt={featuredPost.title}
                className='w-full h-full object-cover brightness-[0.7]'
                loading='lazy'
              />
            ) : (
              <div className='h-full w-full bg-linear-to-br from-primary via-primary/80 to-primary/50' />
            )}
            {/* Overlay tối để text nổi bật */}
            <div className='absolute inset-0 bg-linear-to-t from-black/70 via-black/50 to-transparent' />
          </div>

          {/* Nội dung text nằm trên nền */}
          <div className='relative z-10 flex h-full flex-col justify-end px-6 pb-12 md:px-12 md:pb-16 lg:px-16 lg:pb-20 max-w-5xl mx-auto'>
            {/* Badge nổi bật */}
            <div className='mb-4 md:mb-6 inline-flex items-center rounded-full bg-primary/90 px-4 py-1.5 text-sm font-medium text-primary-foreground shadow-md'>
              <span className='mr-1.5'>⭐</span> Bài viết nổi bật
            </div>

            <h2 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-2xl'>
              {featuredPost.title}
            </h2>

            <p className='mt-4 md:mt-6 text-base sm:text-lg md:text-xl text-white/90 line-clamp-3 md:line-clamp-4 max-w-3xl'>
              {featuredPost.content.substring(0, 300)}...
            </p>

            <div className='mt-6 md:mt-8 flex flex-col sm:flex-row sm:items-center gap-5 md:gap-8'>
              <Button
                variant='default'
                size='lg'
                className='bg-white text-primary hover:bg-white/95 shadow-xl hover:shadow-2xl transition-all duration-300 text-base md:text-lg px-6 md:px-10 py-5 md:py-6 font-semibold'
                asChild
              >
                <Link to={`/post/${featuredPost.id}`}>Đọc ngay →</Link>
              </Button>

              {/* Author info */}
              <div className='flex items-center gap-4 text-white/90'>
                <Avatar className='h-10 w-10 md:h-12 md:w-12 border-2 border-white/60 shadow-md'>
                  <AvatarImage src={featuredPost.authorPhotoURL || 'https://github.com/shadcn.png'} />
                  <AvatarFallback className='bg-primary text-primary-foreground text-lg md:text-xl'>
                    {featuredPost.authorName?.[0]?.toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className='text-sm md:text-base'>
                  <p className='font-medium'>{featuredPost.authorName}</p>
                  <p className='opacity-80'>
                    {featuredPost.createdAt?.toDate()?.toLocaleDateString('vi-VN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className='mb-12 rounded-3xl bg-linear-to-r from-muted/80 to-muted p-12 text-center shadow-xl'>
          <h3 className='text-3xl font-bold text-foreground mb-4'>Chưa có bài viết nổi bật</h3>
          <p className='text-lg text-muted-foreground'>Các bài viết hay nhất sẽ được hiển thị ở đây!</p>
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
                      <AvatarImage src={post.authorPhotoURL || 'https://github.com/shadcn.png'} />
                      <AvatarFallback>{post.authorName?.[0]?.toUpperCase() || 'A'}</AvatarFallback>
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

        {/* Skeleton khi load more */}
        {loadingMore &&
          Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <article key={`skeleton-${i}`} className='rounded-xl border bg-card p-6 shadow-sm animate-pulse'>
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
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <Skeleton className='h-8 w-8 rounded-full' />
                      <Skeleton className='h-5 w-32 rounded-md' />
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
      </div>

      {/* Trigger point cho infinite scroll */}
      <div ref={observerTarget} className='h-20' />

      {posts.length === 0 && !loading && (
        <div className='text-center py-12 text-muted-foreground text-lg'>Chưa có bài viết nào</div>
      )}

      {!hasMore && posts.length > 0 && !loadingMore && (
        <div className='text-center py-12 text-muted-foreground'>Đã xem hết tất cả bài viết</div>
      )}
    </section>
  )
}

export default MainFeed
