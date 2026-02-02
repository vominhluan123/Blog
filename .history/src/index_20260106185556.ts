// functions/src/index.ts

admin.initializeApp()

export const createAdminUser = onCall(async (request) => {
  // 1. Phải đăng nhập
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Bạn phải đăng nhập!')
  }

  // 2. Chỉ admin mới tạo được (dùng custom claims hoặc firestore role)
  // Cách đơn giản nhất: dùng role trong Firestore (như bạn đang làm)
  const callerDoc = await admin.firestore().collection('users').doc(request.auth.uid).get()

  if (!callerDoc.exists || callerDoc.data()?.role !== 'ADMIN') {
    throw new HttpsError('permission-denied', 'Chỉ admin mới có quyền tạo user!')
  }

  const { email, password, displayName, role } = request.data

  if (!email || !password || !displayName || !role) {
    throw new HttpsError('invalid-argument', 'Thiếu thông tin!')
  }

  if (password.length < 6) {
    throw new HttpsError('invalid-argument', 'Mật khẩu quá ngắn!')
  }

  try {
    // Tạo user bằng ADMIN SDK → KHÔNG login tự động
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName
    })

    // Tạo document trong Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      displayName,
      email,
      role: role.toUpperCase(), // USER hoặc ADMIN
      createdAt: admin.firestore.Timestamp.now()
    })

    return {
      success: true,
      uid: userRecord.uid,
      message: 'Tạo user thành công!'
    }
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Email đã tồn tại!')
    }
    console.error(error)
    throw new HttpsError('internal', 'Lỗi server, thử lại sau!')
  }
})
