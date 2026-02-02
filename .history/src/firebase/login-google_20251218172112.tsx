import { useAuth } from '@/contexts/useAuth'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { addDoc, collection } from 'firebase/firestore'
import { useNavigate } from 'react-router'
import { auth, db } from './firebase-config'

const provider = new GoogleAuthProvider()
provider.setCustomParameters({
  prompt: 'select_account' // luôn hỏi chọn lại tài khoản
})
export function useGoogleLogin() {
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, provider)
    // lấy user từ google
    const user = result.user
    // lưu vào context
    setUser(user)
    //lưu vào Firestore
    await addDoc(collection(db, 'users-google'), {
      id: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    })

   toast.success('Đăng nhập thành công')
   setTimeout(() => navigate('/'), 800)
  }

  return { loginWithGoogle }
}
