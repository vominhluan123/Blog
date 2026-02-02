// src/utils/slug.ts
import { USERS_COLLECTION } from '@/firebase/db'
import { db } from '@/firebase/firebase-config'
import { collection, doc, getDocs, query, where } from 'firebase/firestore'

export async function getOrCreateUniqueSlug(displayName: string, uid: string): Promise<string> {
  const shortUid = uid.slice(-6).toLowerCase()
  const baseName = createSlug(displayName.trim())

  // Ưu tiên dùng slug cũ nếu đã tồn tại trong DB
  const userRef = doc(db, USERS_COLLECTION, uid)
  const userSnap = await getDoc(userRef)
  if (userSnap.exists()) {
    const existingSlug = userSnap.data()?.slug
    if (existingSlug) {
      // Nếu đã có slug (dù tên thay đổi), giữ nguyên slug cũ
      console.log('Giữ slug cũ:', existingSlug)
      return existingSlug
    }
  }

  // Nếu chưa có slug → tạo mới với hậu tố uid
  let slug = `${baseName}-${shortUid}`
  let isUnique = await isSlugUnique(slug)
  if (isUnique) return slug

  // Hiếm khi trùng → thêm counter
  let counter = 1
  while (!isUnique) {
    slug = `${baseName}-${shortUid}-${counter}`
    isUnique = await isSlugUnique(slug)
    counter++
  }

  return slug
}

async function isSlugUnique(slug: string): Promise<boolean> {
  const q = query(collection(db, USERS_COLLECTION), where('slug', '==', slug))
  const snap = await getDocs(q)
  return snap.empty
}

export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9 -]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
