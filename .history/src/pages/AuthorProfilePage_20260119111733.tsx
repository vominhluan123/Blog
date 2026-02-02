// src/pages/AuthorProfilePage.tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { POSTS_COLLECTION, PostStatus, USERS_COLLECTION, type Post } from '@/firebase/db'
import { db } from '@/firebase/firebase-config'
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'

const AuthorProfilePage = () => {
  const { authorId } = useParams<{ authorId: string }>()
  const [posts, setPosts] = useState<Post[]>([])
  const [authorInfo, setAuthorInfo] = useState<{
    name: string
    photoURL?: string
    postCount: number
    uid?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

 useEffect(() => {
   if (!authorId) return

   const fetchAuthorData = async () => {
     try {
       setLoading(true)
       setNotFound(false)

       
       const normalizedName = authorId
         .replace(/-/g, ' ') 
         .split(' ')
         .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
         .join(' ') /

       /
       console.log('Tìm theo displayName:', normalizedName) // debug

       const userQ = query(collection(db, USERS_COLLECTION), where('displayName', '==', normalizedName), limit(1))
       const userSnap = await getDocs(userQ)

       if (userSnap.empty) {
         // Thử fallback: tìm chính xác authorId gốc (nếu ai đó nhập slug lowercase)
         const fallbackQ = query(collection(db, USERS_COLLECTION), where('displayName', '==', authorId), limit(1))
         const fallbackSnap = await getDocs(fallbackQ)

         if (fallbackSnap.empty) {
           setNotFound(true)
           return
         }
         // dùng fallback nếu có
         const userDoc = fallbackSnap.docs[0]
         // ... tiếp tục xử lý như dưới
       }

       // Phần còn lại giữ nguyên
       const userDoc = userSnap.docs[0]
       const userData = userDoc.data()
       const uid = userDoc.id

       // ...
     } catch (err) {
       console.error('Lỗi:', err)
       setNotFound(true)
     } finally {
       setLoading(false)
     }
   }

   fetchAuthorData()
 }, [authorId])

  if (notFound && !loading) {
    return (
      <div className='container mx-auto py-20 text-center'>
        <h1 className='text-4xl font-bold mb-4'>Không tìm thấy tác giả</h1>
        <p className='text-muted-foreground'>Slug "{authorId}" không tồn tại hoặc chưa được thiết lập.</p>
      </div>
    )
  }

  return (
    <div className='container mx-auto py-8 px-4 max-w-4xl'>
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
