// CategoryPage.tsx
import { POSTS_COLLECTION, type Post } from '@/firebase/db'
import { db } from '@/firebase/firebase-config'
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'

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

  return <></>
}
export default CategoryPage
