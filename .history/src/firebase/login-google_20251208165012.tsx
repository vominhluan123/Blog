import { useAuth } from "@/contexts/useAuth"
import { signInWithPopup } from "firebase/auth"
import { useNavigate } from "react-router"
import { auth } from "./firebase-config"

export const loginWithGoogle = async () => {
  const navigate = useNavigate()
  const { setUser } = useAuth()

  try {
    const result = await signInWithPopup(auth, provider)

    // lấy user từ google
    const user = result.user

    // lưu vào context
    setUser(user)

    //lưu vào Firestore nếu muốn
    const userRef = collection(db, 'users-google')
    await addDoc(userRef, {
      id: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    })
    navigate('/')
  } catch (error: any) {
    alert(error.code)
  }
}
