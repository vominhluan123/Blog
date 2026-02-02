import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCTzplSBcZ5DPGjHX6N8YAE26gov5iv7V4',
  authDomain: 'blog-page-bcbc8.firebaseapp.com',
  projectId: 'blog-page-bcbc8',
  storageBucket: 'blog-page-bcbc8.firebasestorage.app',
  messagingSenderId: '918383346856',
  appId: '1:918383346856:web:f02029989097e2a474ae9d'
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
// Initialize Firestore
export const db = getFirestore(app)
// Initialize Auth
export const auth = getAuth(app)
