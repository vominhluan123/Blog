// migration-update-slugs.ts
// Chạy bằng: ts-node migration-update-slugs.ts  hoặc deploy lên Cloud Functions một lần

import { createSlug } from '@/utils/slug' // hàm createSlug của bạn
import { initializeApp } from 'firebase/app'
import { collection, doc, getDocs, getFirestore, updateDoc } from 'firebase/firestore'

// Thay bằng config của bạn
const firebaseConfig = {
  apiKey: 'AIzaSyCTzplSBcZ5DPGjHX6N8YAE26gov5iv7V4',
  authDomain: 'blog-page-bcbc8.firebaseapp.com',
  projectId: 'blog-page-bcbc8'
  // ...
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function migrateSlugs() {
  console.log('Bắt đầu migration slug...')

  const usersRef = collection(db, 'users')
  const snapshot = await getDocs(usersRef)

  let updatedCount = 0
  let skippedCount = 0

  for (const userDoc of snapshot.docs) {
    const data = userDoc.data()
    const uid = userDoc.id
    const currentSlug = data.slug

    // Nếu đã có slug đúng định dạng (tên + hậu tố uid) thì skip
    if (currentSlug && currentSlug.includes('-') && currentSlug.endsWith(uid.slice(-6).toLowerCase())) {
      console.log(`Skip user ${uid}: slug đã đúng (${currentSlug})`)
      skippedCount++
      continue
    }

    const displayName = data.displayName || data.fullname || 'user'
    const shortUid = uid.slice(-6).toLowerCase() // 6 ký tự cuối, lowercase cho đẹp
    const newSlug = createSlug(`${displayName}-${shortUid}`)

    try {
      await updateDoc(doc(db, 'users', uid), {
        slug: newSlug,
        updatedAt: new Date() // optional
      })
      console.log(`Updated user ${uid}: ${currentSlug || '(không có)'} → ${newSlug}`)
      updatedCount++
    } catch (err) {
      console.error(`Lỗi update user ${uid}:`, err)
    }

    // Delay nhẹ để tránh rate limit Firestore (nếu nhiều user)
    await new Promise((resolve) => setTimeout(resolve, 300))
  }

  console.log(`\nHoàn tất!`)
  console.log(`- Updated: ${updatedCount} users`)
  console.log(`- Skipped (đã đúng): ${skippedCount} users`)
  console.log(`- Tổng users xử lý: ${snapshot.size}`)
}

migrateSlugs().catch(console.error)
