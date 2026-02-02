// scripts/migrate-slugs.ts
// Chạy bằng: npx ts-node scripts/migrate-slugs.ts

import { initializeApp } from 'firebase/app'
import { collection, doc, getDocs, getFirestore, updateDoc } from 'firebase/firestore'

// Import hàm createSlug từ dự án (điều chỉnh đường dẫn nếu cần)
import { createSlug } from '../src/utils/slug' // ← sửa đường dẫn này cho đúng với dự án của bạn

// Firebase config (đã copy từ bạn)
const firebaseConfig = {
  apiKey: 'AIzaSyCTzplSBcZ5DPGjHX6N8YAE26gov5iv7V4',
  authDomain: 'blog-page-bcbc8.firebaseapp.com',
  projectId: 'blog-page-bcbc8'
  // Nếu cần thêm storageBucket, messagingSenderId, appId thì bổ sung
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function migrateSlugs() {
  console.log('🚀 Bắt đầu migration slug cho tất cả users...')

  const usersRef = collection(db, 'users')
  const snapshot = await getDocs(usersRef)

  let updatedCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const userDoc of snapshot.docs) {
    const data = userDoc.data()
    const uid = userDoc.id
    const currentSlug = data.slug as string | undefined

    // Skip nếu slug đã đúng định dạng (tên + - + 6 ký tự uid lowercase)
    const shortUid = uid.slice(-6).toLowerCase()
    if (currentSlug && currentSlug.endsWith(`-${shortUid}`)) {
      console.log(`⏭️ Skip user ${uid}: slug đã đúng (${currentSlug})`)
      skippedCount++
      continue
    }

    const displayName = (data.displayName || data.fullname || 'user') as string
    const newSlug = createSlug(`${displayName}-${shortUid}`)

    try {
      await updateDoc(doc(db, 'users', uid), {
        slug: newSlug,
        updatedAt: new Date()
      })
      console.log(`✅ Updated user ${uid}: ${currentSlug || '(không có)'} → ${newSlug}`)
      updatedCount++
    } catch (err) {
      console.error(`❌ Lỗi update user ${uid}:`, err)
      errorCount++
    }

    // Delay 300ms để tránh hit rate limit Firestore
    await new Promise((resolve) => setTimeout(resolve, 300))
  }

  console.log('\n=== Migration hoàn tất ===')
  console.log(`- Updated thành công: ${updatedCount} users`)
  console.log(`- Skipped (đã đúng): ${skippedCount} users`)
  console.log(`- Lỗi: ${errorCount} users`)
  console.log(`- Tổng users xử lý: ${snapshot.size}`)
}

migrateSlugs().catch((err) => {
  console.error('Migration thất bại:', err)
  process.exit(1)
})
