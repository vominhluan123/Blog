import * as admin from 'firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions/logger'
import { setGlobalOptions } from 'firebase-functions/options'
import { HttpsError, onCall } from 'firebase-functions/v2/https'

// Khởi tạo Admin SDK (nếu chưa)
admin.initializeApp()

// Giới hạn toàn cục (giữ nguyên nếu bạn muốn, hoặc bỏ cũng được)
setGlobalOptions({ maxInstances: 10 })

/**
 * Hàm callable để ADMIN tạo user mới
 * Gọi từ client: httpsCallable(functions, "createAdminUser")
 */
export const createAdminUser = onCall(async (request) => {
  // 1. Kiểm tra đã đăng nhập chưa
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Bạn phải đăng nhập để thực hiện!')
  }

  const callerUid = request.auth.uid

  // 2. Kiểm tra quyền ADMIN (dùng Firestore role như bạn đang dùng)
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get()

  if (!callerDoc.exists || callerDoc.data()?.role !== 'ADMIN') {
    throw new HttpsError('permission-denied', 'Chỉ admin mới có quyền tạo người dùng!')
  }

  // 3. Lấy dữ liệu từ client
  const { email, password, displayName, role } = request.data

  if (!email || !password || !displayName || !role) {
    throw new HttpsError('invalid-argument', 'Thiếu thông tin bắt buộc!')
  }

  if (password.length < 6) {
    throw new HttpsError('invalid-argument', 'Mật khẩu phải ít nhất 6 ký tự!')
  }

  if (!['user', 'admin'].includes(role.toLowerCase())) {
    throw new HttpsError('invalid-argument', 'Role không hợp lệ (user hoặc admin)!')
  }

  try {
    // 4. Tạo user bằng Admin SDK → KHÔNG tự động login
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName
    })

    // 5. Tạo document trong Firestore (giống code client cũ của bạn)
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      displayName,
      email,
      role: role.toUpperCase(), // USER hoặc ADMIN
      createdAt: Timestamp.now()
    })

    logger.info(`Admin ${callerUid} đã tạo user mới: ${userRecord.uid}`, { structuredData: true })

    return {
      success: true,
      uid: userRecord.uid,
      message: 'Tạo tài khoản thành công!'
    }
  } catch (error: any) {
    logger.error('Lỗi tạo user:', error)

    if (error.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Email này đã được sử dụng!')
    }

    throw new HttpsError('internal', 'Không thể tạo tài khoản. Thử lại sau!')
  }
})
