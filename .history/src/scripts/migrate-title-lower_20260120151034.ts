// migrate-title-lower.ts
import { POSTS_COLLECTION } from '@/firebase/db'
import { db } from '@/firebase/firebase-config'
import { collection, doc, getDocs, query, writeBatch } from 'firebase/firestore'

async function migrateTitleLower() {
  console.log('Bắt đầu migration titleLower...')

  const q = query(collection(db, POSTS_COLLECTION)) // lấy hết, hoặc thêm where nếu muốn giới hạn
  // Nếu nhiều bài quá, có thể chia batch: where('titleLower', '==', null) hoặc limit(500)

  const snapshot = await getDocs(q)
  const total = snapshot.size
  console.log(`Tìm thấy ${total} bài viết`)

  let updatedCount = 0
  const batchSize = 500 // Firestore batch max 500 operations
  let batch = writeBatch(db)
  let operationCount = 0

  for (const document of snapshot.docs) {
    const data = document.data()
    if (!data.title) continue // phòng trường hợp lỗi dữ liệu

    const titleLower = data.title.toLowerCase().trim()

    // Chỉ update nếu chưa có hoặc khác
    if (!data.titleLower || data.titleLower !== titleLower) {
      const ref = doc(db, POSTS_COLLECTION, document.id)
      batch.update(ref, { titleLower })
      updatedCount++
      operationCount++

      // Commit batch khi đầy
      if (operationCount >= batchSize) {
        await batch.commit()
        console.log(`Đã commit ${operationCount} updates...`)
        batch = writeBatch(db)
        operationCount = 0
      }
    }
  }

  // Commit phần còn lại
  if (operationCount > 0) {
    await batch.commit()
  }

  console.log(`Hoàn tất! Đã cập nhật ${updatedCount}/${total} bài viết`)
}

migrateTitleLower()
  .then(() => console.log('Migration thành công'))
  .catch((err) => console.error('Migration lỗi:', err))
