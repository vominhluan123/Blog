// useAuth.tsx
import { USERS_COLLECTION, UserStatus } from '@/firebase/db'
import { auth, db } from '@/firebase/firebase-config'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import React, { createContext, useContext, useEffect, useState } from 'react'

type AuthContextType = {
  user: User | null
  loading: boolean
  setUser: React.Dispatch<React.SetStateAction<User | null>>
  role: string | null
}
const AuthContext = createContext<AuthContextType>({ user: null, loading: true, setUser: () => {}, role: null })

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<string | null>(null) // Thêm role(quyền)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)

      if (currentUser) {
        // Lấy role từ Firestore
        const userRef = doc(db, USERS_COLLECTION, currentUser.uid)
        const userDoc = await getDoc(userRef)

        if (userDoc.exists()) {
          // Đã có document → lấy role
          setRole(userDoc.data()?.role || 'USER')
        } else {
          // Chưa có → tạo mới với role mặc định "user"
          await setDoc(userRef, {
            uid: currentUser.uid,
            displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
            email: currentUser.email,
            role: 'USER', // Mặc định user
            createdAt: Timestamp.now(),
            status: UserStatus.ACTIVE
          })
          setRole('USER')
        }
      } else {
        setRole(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ user, loading, setUser, role }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
