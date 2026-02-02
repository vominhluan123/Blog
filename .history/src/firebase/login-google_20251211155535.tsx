import { useAuth } from '@/contexts/useAuth'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { addDoc, collection } from 'firebase/firestore'
import { useNavigate } from 'react-router'
import { auth, db } from './firebase-config'

export function useGoogleLogin() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({
    pro
  })
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

    navigate('/')
  }

  return { loginWithGoogle }
}
