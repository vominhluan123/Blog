// useAuth.tsx
import { Role, USERS_COLLECTION, UserStatus } from '@/firebase/db'
import { auth, db } from '@/firebase/firebase-config'
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc, onSnapshot, setDoc, Timestamp } from 'firebase/firestore'
import React, { createContext, useContext, useEffect, useState } from 'react'

// Định nghĩa type cho user merge (kết hợp Auth + Firestore)
interface ExtendedUser extends Partial<FirebaseUser> {
  displayName?: string
  photoURL?: string
  role?: string
  status?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
  // Thêm các field khác nếu cần
}

type AuthContextType = {
  user: ExtendedUser | null
  loading: boolean
  role: string | null
  // Không cần setUser nữa vì ta sẽ tự động update realtime
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  role: null
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [firestoreProfile, setFirestoreProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<string | null>(null)

  // 1. Lắng nghe Auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser)
      setLoading(true) // Đợi profile load xong mới set loading false

      if (currentUser) {
        const userRef = doc(db, USERS_COLLECTION, currentUser.uid)

        // Lấy lần đầu (không realtime)
        const userDoc = await getDoc(userRef)
        const now = Timestamp.now()

        if (userDoc.exists()) {
          const data = userDoc.data()
          setFirestoreProfile(data)
          setRole(data.role || Role.USER)
        } else {
          // Tạo mới nếu chưa tồn tại
          const defaultProfile = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
            photoURL: currentUser.photoURL,
            role: Role.USER,
            status: UserStatus.ACTIVE,
            createdAt: now,
            updatedAt: now,
            loginMethods: ['password']
          }
          await setDoc(userRef, defaultProfile)
          setFirestoreProfile(defaultProfile)
          setRole(Role.USER)
        }
      } else {
        setFirestoreProfile(null)
        setRole(null)
      }

      setLoading(false)
    })

    return () => unsubscribeAuth()
  }, [])

  // 2. Lắng nghe realtime thay đổi Firestore profile
  useEffect(() => {
    if (!firebaseUser) return

    const userRef = doc(db, USERS_COLLECTION, firebaseUser.uid)

    const unsubscribeProfile = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data()
          setFirestoreProfile(data)
          setRole(data.role || Role.USER)
        }
      },
      (error) => {
        console.error('Lỗi onSnapshot profile:', error)
      }
    )

    return () => unsubscribeProfile()
  }, [firebaseUser])

  // 3. Merge user: ưu tiên Firestore, fallback về Auth
  const mergedUser: ExtendedUser | null = firebaseUser
    ? {
        ...firebaseUser,
        displayName: firestoreProfile?.displayName ?? firebaseUser.displayName,
        photoURL: firestoreProfile?.photoURL ?? firebaseUser.photoURL,
        role: firestoreProfile?.role ?? Role.USER,
        status: firestoreProfile?.status,
        createdAt: firestoreProfile?.createdAt,
        updatedAt: firestoreProfile?.updatedAt
        // Thêm field khác nếu cần
      }
    : null

  return <AuthContext.Provider value={{ user: mergedUser, loading, role }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
