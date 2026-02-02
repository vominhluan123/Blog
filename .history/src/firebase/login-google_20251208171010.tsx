import { useAuth } from '@/contexts/useAuth'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { addDoc, collection } from 'firebase/firestore'
import { useNavigate } from 'react-router'
import { auth, db } from './firebase-config'

const provider = new GoogleAuthProvider()

const loginWithGoogle = async () => {
  const const handleLoginGoogle = (){
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
  const { setUser } = useAuth()
  const navigate = useNavigate()
 
}

export default loginWithGoogle
