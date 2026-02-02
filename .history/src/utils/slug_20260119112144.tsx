import { limit, query, where } from "firebase/firestore"

// src/utils/slug.ts
export function createSlug(name: string): string {
  if (!name.trim()) {
    return 'user-' + Math.random().toString(36).slice(2, 8)
  }

  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Hàm này sẽ check trùng và thêm hậu tố nếu cần
export async function getOrCreateUniqueSlug(
  displayName: string,
  currentUid?: string // để tránh check chính document của mình khi update
): Promise<string> {
  const baseSlug = createSlug(displayName)
  let slug = baseSlug
  let counter = 1

  const usersRef = collection(db, USERS_COLLECTION)

  while (true) {
    const q = query(usersRef, where('slug', '==', slug), limit(1))
    const snap = await getDocs(q)

    if (snap.empty) {
      return slug
    }

    // Nếu trùng, nhưng là chính mình thì vẫn giữ
    const doc = snap.docs[0]
    if (currentUid && doc.id === currentUid) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter++
  }
}
