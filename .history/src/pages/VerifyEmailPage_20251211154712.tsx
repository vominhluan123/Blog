import { Button } from '@/components/ui/button'
import { auth } from '@/firebase/firebase-config'
import { sendEmailVerification } from 'firebase/auth'
import { useState } from 'react'
import { toast } from 'sonner'

export default function VerifyEmailPage() {
  const user = auth.currentUser
    const router = useRoute()
  const [loading, setLoading] = useState(false)
  // 🔥 1. Tự động kiểm tra trạng thái email đã xác thực hay chưa
  useEffect(() => {
    if (!user) return

    const interval = setInterval(async () => {
      await user.reload() // cập nhật dữ liệu mới nhất từ Firebase

      if (user.emailVerified) {
        toast.success('Email đã được xác thực!')
        clearInterval(interval)
        router.push('/login') // chuyển sang trang login
      }
    }, 3000) // kiểm tra mỗi 3 giây

    return () => clearInterval(interval)
  }, [user, router])
  const handleSendVerify = async () => {
    if (!user) {
      toast.error('Bạn chưa đăng nhập!')
      return
    }
    try {
      setLoading(true)
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

      <Button onClick={handleSendVerify} className='w-full cursor-pointer' disabled={!user || loading}>
        {loading ? 'Đang gửi...' : ' Gửi lại email xác thực'}
      </Button>
    </div>
  )
}
