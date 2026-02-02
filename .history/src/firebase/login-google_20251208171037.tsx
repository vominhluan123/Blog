import { useAuth } from '@/contexts/useAuth'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { addDoc, collection } from 'firebase/firestore'
import { useNavigate } from 'react-router'
import { auth, db } from './firebase-config'

const provider = new GoogleAuthProvider()

const loginWithGoogle =  () => {
}
const { setUser } = useAuth()
const navigate = useNavigate()
   const handleLoginGoogle = (){

 
}

export default loginWithGoogle
