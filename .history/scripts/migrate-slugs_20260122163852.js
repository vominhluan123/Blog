// scripts/migrate-slugs.js
const { initializeApp } = require('firebase/app')
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore')
const { createSlug } = require('../src/utils/slug') // điều chỉnh đường dẫn nếu cần

const firebaseConfig = {
  apiKey: 'AIzaSyCTzplSBcZ5DPGjHX6N8YAE26gov5iv7V4',
  authDomain: 'blog-page-bcbc8.firebaseapp.com',
  projectId: 'blog-page-bcbc8'
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function migrateSlugs() {
  console.log('🚀 Bắt đầu migration slug...')

  const usersRef = collection(db, 'users')
  const snapshot = await getDocs(usersRef)

  let updatedCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const userDoc of snapshot.docs) {
    const data = userDoc.data()
    const uid = userDoc.id
    const currentSlug = data.slug

    const shortUid = uid.slice(-6).toLowerCase()
    if (currentSlug && currentSlug.endsWith(`-${shortUid}`)) {
      console.log(`⏭️ Skip user ${uid}: slug đã đúng (${currentSlug})`)
      skippedCount++
      continue
    }

    const displayName = data.displayName || data.fullname || 'user'
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

    await new Promise((resolve) => setTimeout(resolve, 300))
  }

  console.log('\n=== Migration hoàn tất ===')
  console.log(`- Updated thành công: ${updatedCount} users`)
  console.log(`- Skipped: ${skippedCount} users`)
  console.log(`- Lỗi: ${errorCount} users`)
  console.log(`- Tổng users: ${snapshot.size}`)
}

migrateSlugs().catch((err) => {
  console.error('Migration thất bại:', err)
  process.exit(1)
})
