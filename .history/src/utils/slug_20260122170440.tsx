// src/utils/slug.ts
import { USERS_COLLECTION } from '@/firebase/db'
import { db } from '@/firebase/firebase-config'
import { collection, getDocs, query, where } from 'firebase/firestore'

export async function getOrCreateUniqueSlug(displayName: string, uid: string): Promise<string> {
  const baseName = displayName.trim().toLowerCase().replace(/\s+/g, '-')
  let slug = createSlug(baseName) // chỉ dùng tên

  // Kiểm tra trùng lặp
  let isUnique = await isSlugUnique(slug)
  if (isUnique) return slug

  // Nếu trùng, thêm số đếm (không dùng uid)
  let counter = 1
  while (!isUnique) {
    const candidate = `${slug}-${counter}`
    isUnique = await isSlugUnique(candidate)
    if (isUnique) return candidate
    counter++
  }

  return slug // fallback
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
