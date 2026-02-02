// src/pages/AuthorProfilePage.tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { POSTS_COLLECTION, PostStatus, USERS_COLLECTION, type Post } from '@/firebase/db'
import { db } from '@/firebase/firebase-config'
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
  where
} from 'firebase/firestore'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'

const PAGE_SIZE = 12

const AuthorProfilePage = () => {
  const { slug } = useParams<{ slug: string }>()
  const [posts, setPosts] = useState<Post[]>([])
  const [authorInfo, setAuthorInfo] = useState<{
    name: string
    photoURL?: string
    postCount: number
    uid?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [notFound, setNotFound] = useState(false)

  const observerTarget = useRef<HTMLDivElement>(null)

  const fetchAuthorAndPosts = async (isInitial: boolean = true) => {
    if (!slug) return

    try {
      if (isInitial) {
        setLoading(true)
        setNotFound(false)
      } else {
        setLoadingMore(true)
      }

      let uid: string

      // Chỉ fetch user info khi là lần đầu
      if (isInitial) {
        const userQ = query(collection(db, USERS_COLLECTION), where('slug', '==', slug), limit(1))
        const userSnap = await getDocs(userQ)

        if (userSnap.empty) {
          setNotFound(true)
          return
        }

        const userDoc = userSnap.docs[0]
        uid = userDoc.id
        const userData = userDoc.data()

        setAuthorInfo({
          name: userData.displayName || 'Ẩn danh',
          photoURL: userData.photoURL,
          postCount: 0,
          uid
        })
      } else if (!authorInfo?.uid) {
        return // chưa có uid thì không fetch tiếp
      } else {
        uid = authorInfo.uid
      }

      // Fetch posts
      let postsQ = query(
        collection(db, POSTS_COLLECTION),
        where('authorId', '==', uid),
        where('status', '==', PostStatus.APPROVED),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE)
      )

      if (!isInitial && lastDoc) {
        postsQ = query(postsQ, startAfter(lastDoc))
      }

      const postsSnap = await getDocs(postsQ)
      const newPosts = postsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Post[]

      setPosts((prev) => (isInitial ? newPosts : [...prev, ...newPosts]))
      setLastDoc(postsSnap.docs[postsSnap.docs.length - 1] || null)

      if (postsSnap.docs.length < PAGE_SIZE) {
        setHasMore(false)
      }

      // Cập nhật postCount (ước lượng)
      if (isInitial) {
        setAuthorInfo((prev) => (prev ? { ...prev, postCount: newPosts.length } : null))
      }
    } catch (err) {
      console.error('Lỗi lấy thông tin tác giả:', err)
      setNotFound(true)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Load initial data
  useEffect(() => {
    fetchAuthorAndPosts(true)
  }, [slug])

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (loading || loadingMore || !hasMore || !observerTarget.current) return

      const bottom = Math.ceil(window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 300

      if (bottom) {
        fetchAuthorAndPosts(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loading, loadingMore, hasMore, lastDoc, authorInfo?.uid, slug]) // thêm slug để an toàn

  if (notFound && !loading) {
    return (
      <div className='container mx-auto py-20 text-center px-4'>
        <h1 className='text-4xl font-bold mb-4'>Không tìm thấy tác giả</h1>
        <p className='text-lg text-muted-foreground mb-6'>Không có tác giả nào với đường dẫn "{slug}".</p>
        <Button asChild>
          <Link to='/'>Quay về trang chủ</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className='container mx-auto py-8 px-4 max-w-5xl'>
      {loading && !authorInfo ? (
        <div className='flex flex-col items-center gap-6 mb-10'>
          <Skeleton className='h-20 w-20 rounded-full' />
          <div className='space-y-2 text-center'>
            <Skeleton className='h-10 w-48' />
            <Skeleton className='h-5 w-32' />
          </div>
        </div>
      ) : (
        authorInfo && (
          <div className='flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-12 bg-card p-6 md:p-8 rounded-2xl shadow-md border'>
            <Avatar className='h-24 w-24 md:h-28 md:w-28 border-4 border-background shadow-lg'>
              <AvatarImage src={authorInfo.photoURL} alt={authorInfo.name} />
              <AvatarFallback className='text-3xl bg-primary/10 text-primary'>
                {authorInfo.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className='text-center sm:text-left'>
              <h1 className='text-3xl md:text-4xl font-bold'>{authorInfo.name}</h1>
              <p className='text-lg text-muted-foreground mt-2'>{authorInfo.postCount} bài viết đã đăng</p>
            </div>
          </div>
        )
      )}

      <h2 className='text-2xl md:text-3xl font-bold mb-6'>Bài viết của tác giả</h2>

      {loading && posts.length === 0 ? (
        <div className='space-y-6'>
          {[...Array(4)].map((_, i) => (
            <div key={i} className='rounded-xl border bg-card p-4 shadow-sm'>
              <Skeleton className='h-48 w-full rounded-lg mb-4' />
              <Skeleton className='h-8 w-3/4 mb-3' />
              <Skeleton className='h-4 w-1/2' />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className='text-center py-16 text-muted-foreground text-lg border rounded-xl bg-muted/30'>
          Tác giả này chưa có bài viết nào được duyệt.
        </div>
      ) : (
        <div className='space-y-6'>
          {posts.map((post) => (
            <Link key={post.id} to={`/post/${post.id}`} className='block group'>
              <Card className='overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1'>
                <CardContent className='p-0'>
                  {post.image && (
                    <img
                      src={post.image}
                      alt={post.title}
                      className='w-full h-48 md:h-56 object-cover'
                      loading='lazy'
                    />
                  )}
                  <div className='p-6'>
                    <h3 className='text-xl md:text-2xl font-semibold group-hover:text-primary transition-colors line-clamp-2'>
                      {post.title}
                    </h3>
                    <p className='mt-3 text-sm text-muted-foreground line-clamp-2'>
                      {post.content?.substring(0, 150)}...
                    </p>
                    <div className='mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground'>
                      <span>
                        {post.createdAt?.toDate?.()
                          ? post.createdAt.toDate().toLocaleDateString('vi-VN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })
                          : 'N/A'}
                      </span>
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

          {loadingMore && (
            <div className='space-y-6'>
              {[...Array(3)].map((_, i) => (
                <div key={i} className='rounded-xl border bg-card p-4 shadow-sm animate-pulse'>
                  <Skeleton className='h-48 w-full rounded-lg mb-4' />
                  <Skeleton className='h-8 w-3/4 mb-3' />
                  <Skeleton className='h-4 w-1/2' />
                </div>
              ))}
            </div>
          )}

          <div ref={observerTarget} className='h-20' />
        </div>
      )}
    </div>
  )
}

export default AuthorProfilePage
