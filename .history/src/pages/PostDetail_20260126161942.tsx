import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/useAuth'
import { COMMENT_COLLECTION, LIKE_COLLECTION, POSTS_COLLECTION, type Post } from '@/firebase/db'
import { db } from '@/firebase/firebase-config'
import { useTitle } from '@/hooks/useTitle'
import DOMPurify from 'dompurify'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where
} from 'firebase/firestore'
import { Clock, Heart, MessageSquare } from 'lucide-react'
import { useEffect, useState } from 'react'
import 'react-quill-new/dist/quill.snow.css'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'

const PostDetail = () => {
  const { user } = useAuth()
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([])
  const [relatedLoading, setRelatedLoading] = useState(false)
  const [hasLiked, setHasLiked] = useState(false)
  const [optimisticLikes, setOptimisticLikes] = useState(0)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(true)
  useTitle(post ? `${post.title} • ${post.authorName || 'Tác giả'} | Blog` : 'Đang tải bài viết...')
  useEffect(() => {
    if (!post) return

    const fetchRelated = async () => {
      setRelatedLoading(true)
      try {
        const postsRef = collection(db, POSTS_COLLECTION)
        let candidates: Post[] = []

        // 1. Ưu tiên lấy theo TAG nếu bài viết có tag
        if (post.tags && post.tags.length > 0) {
          const tagsToMatch = post.tags.slice(0, 10)

          const qTag = query(
            postsRef,
            where('tags', 'array-contains-any', tagsToMatch),
            orderBy('createdAt', 'desc'),
            limit(6)
          )

          const snapTag = await getDocs(qTag)

          candidates = snapTag.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }) as Post)
            .filter((p) => p.id !== post.id)
        }

        // 2. Nếu tag không có hoặc 0 → fallback category
        if (candidates.length === 0 && post.category) {
          const qCat = query(postsRef, where('category', '==', post.category), orderBy('createdAt', 'desc'), limit(5))

          const snapCat = await getDocs(qCat)

          candidates = snapCat.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }) as Post)
            .filter((p) => p.id !== post.id)
        }

        setRelatedPosts(candidates.slice(0, 2))
      } catch (err: any) {
        console.error('Lỗi fetch related:', err)
        console.error('Error code:', err.code)
        console.error('Error message:', err.message)
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
  // Kiểm tra user đã like chưa + lắng nghe thay đổi
  useEffect(() => {
    if (!user || !id || !post) return

    const likeRef = doc(db, POSTS_COLLECTION, id, LIKE_COLLECTION, user.uid)

    getDoc(likeRef)
      .then((snap) => {
        const liked = snap.exists()
        setHasLiked(liked)
      })
      .catch((err) => {
        console.error('Lỗi check like:', err)
      })
  }, [user, id, post])
  useEffect(() => {
    if (post?.likesCount !== undefined) {
      setOptimisticLikes(post.likesCount)
    }
  }, [post?.likesCount])
  useEffect(() => {
    if (!id) return

    const q = query(
      collection(db, POSTS_COLLECTION, id, COMMENT_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(20) // phân trang sau nếu cần
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }))
        setComments(list)
        setLoadingComments(false)
      },
      (err) => {
        console.error(err)
        setLoadingComments(false)
      }
    )

    return unsub
  }, [id])
  const handleLike = async () => {
    if (!user) {
      return toast.info('Vui lòng đăng nhập để thích bài viết')
    }

    const postRef = doc(db, POSTS_COLLECTION, id!)
    const likeRef = doc(postRef, LIKE_COLLECTION, user.uid)

    const currentlyHasLiked = hasLiked
    const delta = currentlyHasLiked ? -1 : 1

    // Optimistic update
    setHasLiked(!currentlyHasLiked)
    setOptimisticLikes((prev) => Math.max(0, prev + delta))

    try {
      await runTransaction(db, async (transaction) => {
        const postSnap = await transaction.get(postRef)
        if (!postSnap.exists()) throw new Error('Bài viết không tồn tại')

        const currentCount = postSnap.data()?.likesCount ?? 0
        const newCount = Math.max(0, currentCount + delta)

        transaction.update(postRef, { likesCount: newCount })

        if (currentlyHasLiked) {
          transaction.delete(likeRef)
        } else {
          transaction.set(likeRef, { likeAt: serverTimestamp() }) // dùng serverTimestamp tốt hơn
        }
      })
    } catch (err) {
      console.error('Like error:', err)
      toast.error('Không thể thực hiện thao tác. Thử lại nhé!')

      setHasLiked(currentlyHasLiked)
      setOptimisticLikes(post?.likesCount ?? 0)
    }
  }
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return toast('Vui lòng đăng nhập')
    if (!newComment.trim()) return toast('Nội dung không được để trống')

    const trimmed = newComment.trim()
    if (trimmed.length > 2000) return toast('Bình luận quá dài (tối đa 2000 ký tự)')

    const postRef = doc(db, POSTS_COLLECTION, id!)
    const commentsRef = collection(postRef, COMMENT_COLLECTION)
    try {
      await runTransaction(db, async (t) => {
        const postSnap = await t.get(postRef)
        if (!postSnap.exists()) throw new Error('Bài không tồn tại')

        t.set(doc(commentsRef), {
          userId: user.uid,
          authorName: user.displayName || 'Người dùng ẩn danh',
          authorPhotoURL: user.photoURL || null,
          content: trimmed,
          createdAt: serverTimestamp()
        })
        t.update(postRef, {
          commentsCount: increment(1)
        })
      })

      setNewComment('')
      toast.success('Bình luận đã được gửi!')
    } catch (err) {
      console.error('Comment error:', err)
      toast.error('Không gửi được bình luận, thử lại sau')
    }
  }
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
                {Math.ceil(post.content.length / 1000)} phút đọc
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
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content || '') }}
        />

        {/* Action bar */}
        <div className='flex items-center justify-between mt-12 py-6 border-t border-border'>
          <div className='flex gap-6'>
            <Button variant='ghost' className='gap-2' onClick={handleLike} disabled={!user}>
              <Heart className={`h-5 w-5 ${hasLiked ? 'fill-red-500 text-red-500' : ''}`} />
              <span>Thích ({optimisticLikes})</span>
            </Button>
          </div>
        </div>
        <div className='mt-20 border-t pt-12'>
          <h2 className='text-3xl font-bold mb-8 text-foreground'>Bình luận ({comments.length})</h2>

          {user ? (
            <div className='mb-12 bg-card border rounded-2xl p-6 shadow-sm'>
              <div className='flex gap-4'>
                <Avatar className='h-11 w-11 ring-2 ring-primary/10'>
                  <AvatarImage src={user.photoURL || undefined} />
                  <AvatarFallback>{user.displayName?.[0] || 'U'}</AvatarFallback>
                </Avatar>

                <div className='flex-1'>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={`Bạn đang nghĩ gì về bài viết này, ${user.displayName?.split(' ')[0] || 'bạn'} ơi? 😊`}
                    className='w-full p-4 bg-background border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all'
                    rows={4}
                  />

                  <div className='flex justify-end mt-3'>
                    <Button
                      type='submit'
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || newComment.length > 2000}
                      className='px-6 font-medium'
                    >
                      Gửi bình luận
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className='mb-12 text-center py-10 bg-muted/50 dark:bg-card/50 rounded-2xl border-2 border-dashed border-border'>
              <p className='text-lg text-muted-foreground mb-4'>
                Đăng nhập để chia sẻ suy nghĩ của bạn với mọi người nhé!
              </p>
              <Button asChild>
                <Link to='/login'>Đăng nhập ngay</Link>
              </Button>
            </div>
          )}

          {/* Danh sách bình luận */}
          {loadingComments ? (
            <div className='space-y-6'>
              {[1, 2].map((i) => (
                <div key={i} className='flex gap-4 animate-pulse'>
                  <Skeleton className='h-12 w-12 rounded-full' />
                  <div className='flex-1 space-y-3'>
                    <Skeleton className='h-5 w-32' />
                    <Skeleton className='h-4 w-full' />
                    <Skeleton className='h-4 w-3/4' />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className='text-center py-16 bg-muted/50 dark:bg-card/50 rounded-2xl'>
              <MessageSquare className='h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50' />
              <p className='text-lg text-muted-foreground'>Chưa có bình luận nào.</p>
              <p className='text-sm text-muted-foreground/80 mt-2'>Hãy là người đầu tiên chia sẻ suy nghĩ của bạn!</p>
            </div>
          ) : (
            <div className='space-y-8'>
              {comments.map((c) => (
                <div
                  key={c.id}
                  className='group flex gap-5 bg-card border rounded-2xl p-6 hover:shadow-md transition-all duration-300 hover:border-primary/20'
                >
                  <Avatar className='h-12 w-12 ring-2 ring-primary/10 shrink-0'>
                    <AvatarImage src={c.authorPhotoURL || undefined} />
                    <AvatarFallback className='bg-primary/10 text-primary font-semibold'>
                      {c.authorName?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-3 mb-2'>
                      <p className='font-semibold text-foreground'>{c.authorName}</p>
                      <span className='text-xs text-muted-foreground'>
                        {c.createdAt?.toDate?.().toLocaleDateString('vi-VN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <p className='text-foreground leading-relaxed whitespace-pre-wrap wrap-break-word'>{c.content}</p>

                    {/* Có thể thêm nút reply hoặc like comment sau này */}
                    {/* <div className='mt-4 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity'>
                      <Button variant='ghost' size='sm' className='h-8 text-xs'>
                        <Heart className='h-3.5 w-3.5 mr-1' />
                        Thích
                      </Button>
                      <Button variant='ghost' size='sm' className='h-8 text-xs'>
                        Trả lời
                      </Button>
                    </div> */}
                  </div>
                </div>
              ))}
            </div>
          )}
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
