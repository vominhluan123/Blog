import { useAuth } from '@/contexts/useAuth'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { auth, db } from './firebase-config'
import { DEFAULT_POST_STATUS, USERS_COLLECTION } from './db'

const provider = new GoogleAuthProvider()
provider.setCustomParameters({
  prompt: 'select_account' // luôn hỏi chọn lại tài khoản
})
export function useGoogleLogin() {
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      // Lưu vào context
      setUser(user)

      // Dùng uid làm document ID (chung collection users)
      const userRef = doc(db, USERS_COLLECTION, user.uid)

      // Kiểm tra user đã tồn tại chưa
      const userDoc = await getDoc(userRef)

      if (!userDoc.exists()) {
        // Tạo mới với role mặc định "user"
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'user', // ← Role mặc định
          createdAt: new Date(),
          loginMethods: ['google'] // Optional: lưu phương thức login
        })
      } else {
        // Đã có → update thông tin mới nhất (nếu Google thay đổi displayName...)
        await setDoc(
          userRef,
          {
            displayName: user.displayName,
            photoURL: user.photoURL,
            updatedAt: new Date()
          },
          { merge: true }
        )
      }

      toast.success('Đăng nhập thành công')
      setTimeout(() => navigate('/'), 800)
    } catch (error: any) {
      console.error('Google login error:', error)
      toast.error(error.message || 'Đăng nhập thất bại')
    }
  }

  return { loginWithGoogle }
}
