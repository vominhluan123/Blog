// src/utils/slug.ts
import { collection, getDocs, query, where } from 'firebase/firestore'

export async function getOrCreateUniqueSlug(displayName: string, uid: string): Promise<string> {
  const baseName = displayName.trim().toLowerCase().replace(/\s+/g, '-')
  let slug = baseName
  const shortUid = uid.slice(-6).toLowerCase()

  // Thử slug cơ bản
  let isUnique = await isSlugUnique(slug)
  if (isUnique) return slug

  // Thêm hậu tố uid nếu trùng
  slug = `${baseName}-${shortUid}`
  isUnique = await isSlugUnique(slug)
  if (isUnique) return slug

  // Nếu vẫn trùng (hiếm), thêm số ngẫu nhiên
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
