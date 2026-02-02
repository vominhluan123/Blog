import { useAuth } from "@/contexts/useAuth"
import { signInWithPopup } from "firebase/auth"
import { useNavigate } from "react-router"
import { auth } from "./firebase-config"

export function useGoogleLogin() {
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, provider)
    const user = result.user

    setUser(user)

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
