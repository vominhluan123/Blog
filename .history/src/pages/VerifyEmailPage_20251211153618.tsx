import { Button } from '@/components/ui/button'
import { auth } from '@/firebase/firebase-config'
import { sendEmailVerification } from 'firebase/auth'
import { useState } from 'react'
import { toast } from 'sonner'

export default function VerifyEmailPage() {
  const user = auth.currentUser
  const [loading, setLoading] = useState(false)
  console.log('🚀 ~ VerifyEmailPage ~ user:', user)

  const handleSendVerify = async () => {
    if (!user) {
      toast.error('Bạn chưa đăng nhập!')
      return
    }
    try {
      await sendEmailVerification(user)
      toast.success('Email xác thực đã được gửi! Kiểm tra hộp thư.')
    } catch (err) {
      toast.error('Gửi email thất bại. Thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='max-w-sm mx-auto mt-10'>
      <h2 className='text-xl font-semibold mb-4'>Xác thực email</h2>
      <p className='text-sm mb-4'>
        {' '}
        {user ? (
          <>
            Email hiện tại: <strong>{user.email}</strong>
            <br />
            Nhấn nút dưới để gửi lại email xác thực.
          </>
        ) : (
          'Bạn cần đăng nhập để gửi email xác thực.'
        )}
      </p>

      <Button onClick={handleSendVerify} className='w-full cursor-pointer' disabled={!user}>
        Gửi lại email xác thực
      </Button>
    </div>
  )
}
