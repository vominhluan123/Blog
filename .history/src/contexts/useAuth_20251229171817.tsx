// useAuth.tsx
import { auth } from '@/firebase/firebase-config'
import { onAuthStateChanged, type User } from 'firebase/auth'
import React, { createContext, useContext, useEffect, useState } from 'react'

type AuthContextType = {
  user: User | null
  loading: boolean
  setUser: React.Dispatch<React.SetStateAction<User | null>>
}
const AuthContext = createContext<AuthContextType>({ user: null, loading: true, setUser: () => {} })

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<string | null>(null) // Thêm role(quyền)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        // Lấy role từ Firestore users collection
        const userDocRef = doc(db, 'users', currentUser.uid)
        const userDoc = await getDoc(userDocRef)
        if (userDoc.exists()) {
          setRole(userDoc.data().role || 'user')
        } else {
          // Nếu chưa có document → tạo mặc định
          await setDoc(userDocRef, {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            email: currentUser.email,
            role: 'user'
          })
          setRole('user')
        }
      } else {
        setRole(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])
  return <AuthContext.Provider value={{ user, loading, setUser }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
