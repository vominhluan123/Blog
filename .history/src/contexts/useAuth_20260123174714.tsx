// useAuth.tsx
import { Role, USERS_COLLECTION, UserStatus } from '@/firebase/db'
import { auth, db } from '@/firebase/firebase-config'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc, setDoc, Timestamp, updateDoc } from 'firebase/firestore'
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
        const userRef = doc(db, USERS_COLLECTION, currentUser.uid)
        const userDoc = await getDoc(userRef)
        const now = Timestamp.now()

        let userData = userDoc.exists() ? userDoc.data() : null

        // Nếu chưa có document → tạo mới
        if (!userDoc.exists()) {
          const defaultDisplayName =
            currentUser.displayName || currentUser.email?.split('@')[0] || 'User-' + currentUser.uid.slice(0, 8)

          const newSlug = await getOrCreateUniqueSlug(defaultDisplayName, currentUser.uid)

          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: defaultDisplayName,
            photoURL: currentUser.photoURL,
            role: Role.USER,
            status: UserStatus.ACTIVE,
            slug: newSlug, // ← THÊM slug
            createdAt: now,
            updatedAt: now,
            loginMethods: ['password'] // sẽ update sau nếu Google
          })

          setRole(Role.USER)
          userData = { slug: newSlug, displayName: defaultDisplayName } // để dùng dưới
        } else {
          setRole(userDoc.data()?.role || Role.USER)

          // Kiểm tra và tạo slug nếu thiếu (cho user cũ hoặc Google login trước đó)
          if (!userDoc.data()?.slug) {
            const displayName =
              userDoc.data().displayName ||
              currentUser.displayName ||
              currentUser.email?.split('@')[0] ||
              'User-' + currentUser.uid.slice(0, 8)

            const newSlug = await getOrCreateUniqueSlug(displayName, currentUser.uid)

            await updateDoc(userRef, {
              slug: newSlug,
              updatedAt: now
            })

            console.log(`Tạo slug cho user cũ/login: ${currentUser.uid} → ${newSlug}`)
          }
        }

        // Optional: Đồng bộ displayName/photo từ Auth nếu Google cung cấp mới hơn
        if (currentUser.displayName && userData?.displayName !== currentUser.displayName) {
          await updateDoc(userRef, { displayName: currentUser.displayName })
        }
        if (currentUser.photoURL && userData?.photoURL !== currentUser.photoURL) {
          await updateDoc(userRef, { photoURL: currentUser.photoURL })
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
