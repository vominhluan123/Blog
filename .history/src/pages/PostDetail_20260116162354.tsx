import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/useAuth'
import { POSTS_COLLECTION, PostStatus, type Post } from '@/firebase/db'
import { db } from '@/firebase/firebase-config'
import { useTitle } from '@/hooks/useTitle'
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { Clock, Heart, MessageSquare, Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'

const PostDetail = () => {
  const { user } = useAuth()
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([])
  const [relatedLoading, setRelatedLoading] = useState(false)
  useTitle(post ? `${post.title} • ${post.authorName || 'Tác giả'} | Blog` : 'Đang tải bài viết...')
  useEffect(() => {
    if (!post) return

    const fetchRelated = async () => {
      setRelatedLoading(true)
      try {
        const postsRef = collection(db, POSTS_COLLECTION)
        let candidates: Post[] = []

        // Ưu tiên 1: thử theo tag nếu có
        if (post.tags && post.tags.length > 0) {
          const tagsToMatch = post.tags.slice(0, 10)
          console.log('Thử query theo tags:', tagsToMatch)

          const qTag = query(
            postsRef,
            where('tags', 'array-contains-any', tagsToMatch),
            where('status', '==', 'PUBLISHED'), // comment tạm nếu nghi ngờ status
            orderBy('createdAt', 'desc'),
            limit(6)
          )

          const snapTag = await getDocs(qTag)
          console.log('Tag query found:', snapTag.size, 'docs')

          candidates = snapTag.docs
            .map((doc) => ({ id: doc.id, ...doc.data() } as Post))
            .filter((p) => p.id !== post.id)

          if (candidates.length > 0) {
            // Có kết quả từ tag → sort theo score
            candidates = candidates
              .map((p) => {
                const common = p.tags?.filter((t) => post.tags!.includes(t)) || []
                return { post: p, score: common.length }
              })
              .sort((a, b) => b.score - a.score || b.post.createdAt.toMillis() - a.post.createdAt.toMillis())
              .map((item) => item.post)
          }
        }

        // Nếu tag không có kết quả (hoặc không có tag) → fallback category
        if (candidates.length === 0 && post.category) {
          console.log('Fallback sang category:', post.category)

          const qCat = query(
            postsRef,
            where('category', '==', post.category),
            where('status', '==', 'PUBLISHED'), // comment tạm nếu cần
            orderBy('createdAt', 'desc'),
            limit(5)
          )

          const snapCat = await getDocs(qCat)
          console.log('Category query found:', snapCat.size, 'docs')

          candidates = snapCat.docs
            .map((doc) => ({ id: doc.id, ...doc.data() } as Post))
            .filter((p) => p.id !== post.id)
        }

        // Cuối cùng nếu vẫn 0 → có thể fallback lấy mới nhất (optional)
        if (candidates.length === 0) {
          console.log('Fallback cuối: lấy bài mới nhất')
          const qAll = query(postsRef, where('status', '==', 'PUBLISHED'), orderBy('createdAt', 'desc'), limit(4))
          const snapAll = await getDocs(qAll)
          candidates = snapAll.docs
            .map((doc) => ({ id: doc.id, ...doc.data() } as Post))
            .filter((p) => p.id !== post.id)
        }

        setRelatedPosts(candidates.slice(0, 2))
      } catch (err: any) {
        console.error('Lỗi fetch related:', err)
        if (err.code === 'failed-precondition' || err.code === 'unimplemented') {
          console.warn('Thiếu index Firestore! Kiểm tra console Firebase để tạo index.')
        }
        setRelatedPosts([])
      } finally {
        setRelatedLoading(false)
      }
    }

    fetchRelated()
  }, [post])
  useEffect(() => {
    const fetchPost = async () => {
      if (!id) {
        setError('Không tìm thấy ID bài viết')
        setLoading(false)
        return
      }

      try {
        const postRef = doc(db, 'posts', id)
        const postSnap = await getDoc(postRef)

        if (postSnap.exists()) {
          setPost({ id: postSnap.id, ...postSnap.data() } as Post)
        } else {
          setError('Bài viết không tồn tại')
        }
      } catch (err: any) {
        console.error('Lỗi lấy bài viết:', err)
        setError('Không thể tải bài viết. Vui lòng thử lại!')
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [id])

  if (loading) {
    return (
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <Skeleton className='h-12 w-3/4 rounded-lg mb-6' />
        <div className='flex items-center gap-4 mb-8'>
          <Skeleton className='h-10 w-10 rounded-full' />
          <div className='space-y-2'>
            <Skeleton className='h-5 w-32 rounded-md' />
            <Skeleton className='h-4 w-48 rounded-md' />
          </div>
        </div>
        <Skeleton className='h-6 w-full rounded-md mb-8' />
        <Skeleton className='h-64 w-full rounded-2xl mb-10' />
        <div className='space-y-4'>
          <Skeleton className='h-6 w-full rounded-md' />
          <Skeleton className='h-6 w-full rounded-md' />
          <Skeleton className='h-6 w-2/3 rounded-md' />
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <h1 className='text-3xl font-bold text-muted-foreground'>{error || 'Bài viết không tồn tại 😢'}</h1>
      </div>
    )
  }
  return (
    <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
      {/* Tiêu đề + meta */}
      <article>
        <h1 className='text-h1 font-extrabold mb-6 text-foreground leading-tight'>{post.title}</h1>

        <div className='flex items-center gap-4 mb-8 text-sm text-muted-foreground'>
          <Avatar className='h-10 w-10'>
            <AvatarImage
              src={post.authorPhotoURL ?? 'https://github.com/shadcn.png'}
              alt={post.authorName || user?.displayName || 'L'}
            />
            <AvatarFallback>{post.authorName?.charAt(0) || 'A'}</AvatarFallback>
          </Avatar>
          <div>
            <p className='font-medium text-foreground'>{post.authorName}</p>
            <div className='flex items-center gap-2'>
              <time dateTime={post.createdAt.toDate().toISOString()}>
                {post.createdAt.toDate().toLocaleDateString()}
              </time>
              <span>•</span>
              <span className='flex items-center gap-1'>
                <Clock className='h-4 w-4' />
                {Math.ceil(post.content.length / 1000)} phút đọc {/* Ước tính thời gian đọc */}
              </span>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className='flex flex-wrap gap-2 mb-8'>
          {post.tags?.map((tag) => (
            <Badge key={tag} variant='secondary' className='text-xs'>
              {tag}
            </Badge>
          ))}
        </div>

        {/* Hình cover */}
        {post.image && (
          <div className='mb-10 overflow-hidden rounded-2xl'>
            <img src={post.image} alt={post.title} className='w-full h-auto object-cover aspect-video' />
          </div>
        )}

        {/* Nội dung bài viết */}
        <div
          className='prose dark:prose-invert max-w-none text-foreground'
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Action bar */}
        <div className='flex items-center justify-between mt-12 py-6 border-t border-border'>
          <div className='flex gap-6'>
            <Button variant='ghost' className='gap-2'>
              <Heart className='h-5 w-5' />
              <span>Thích ({post.likesCount})</span>
            </Button>
            <Button variant='ghost' className='gap-2'>
              <MessageSquare className='h-5 w-5' />
              <span>Bình luận</span>
            </Button>
          </div>
          <Button variant='ghost' className='gap-2'>
            <Share2 className='h-5 w-5' />
            <span>Chia sẻ</span>
          </Button>
        </div>

        <div className='mt-16'>
          <h2 className='text-h2 font-bold mb-6'>Bài viết liên quan</h2>
          {relatedLoading ? (
            <div className='grid md:grid-cols-2 gap-6'>
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className='rounded-xl overflow-hidden border bg-card animate-pulse'>
                  <div className='p-6 space-y-3'>
                    <div className='h-7 w-3/4 bg-muted rounded' />
                    <div className='space-y-2'>
                      <div className='h-4 w-full bg-muted rounded' />
                      <div className='h-4 w-2/3 bg-muted rounded' />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : relatedPosts.length === 0 ? (
            <p className='text-muted-foreground'>Chưa có bài viết liên quan phù hợp.</p>
          ) : (
            <div className='grid md:grid-cols-2 gap-6'>
              {relatedPosts.map((relPost) => (
                <Link
                  key={relPost.id}
                  to={`/post/${relPost.id}`}
                  className='group block rounded-xl overflow-hidden border bg-card hover:shadow-md transition-all hover:-translate-y-1'
                >
                  {relPost.image && (
                    <div className='aspect-video overflow-hidden'>
                      <img
                        src={relPost.image}
                        alt={relPost.title}
                        className='w-full h-full object-cover transition-transform group-hover:scale-105'
                      />
                    </div>
                  )}
                  <div className='p-6'>
                    <h3 className='text-lg font-bold group-hover:text-primary transition-colors line-clamp-2'>
                      {relPost.title}
                    </h3>
                    <p className='mt-2 text-sm text-muted-foreground line-clamp-2'>
                      {relPost.content.replace(/<[^>]+>/g, '').slice(0, 120)}...
                    </p>
                    <div className='mt-4 text-xs text-muted-foreground'>
                      {relPost.createdAt.toDate().toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </article>
    </div>
  )
}

export default PostDetail
