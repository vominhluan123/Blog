import { useAuth } from '@/contexts/useAuth'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { addDoc, collection } from 'firebase/firestore'
import { useNavigate } from 'react-router'
import { auth, db } from './firebase-config'

const provider = new GoogleAuthProvider()

const loginWithGoogle = async () => {
  const const handleLoginGoogle = (){

  }
  const { setUser } = useAuth()
  const navigate = useNavigate()
 
}

export default loginWithGoogle
