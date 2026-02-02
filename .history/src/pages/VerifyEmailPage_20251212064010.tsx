import Spinner from '@/components/loading-button/Spinner'
import { Button } from '@/components/ui/button'
import { auth } from '@/firebase/firebase-config'
import { useTitle } from '@/hooks/useTitle'
import { sendEmailVerification } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

export default function VerifyEmailPage() {
  useTitle('Xác thực email')
  const user = auth.currentUser
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  // 🔥 1. Tự động kiểm tra trạng thái email đã xác thực hay chưa
  useEffect(() => {
    if (!user) return
    const interval = setInterval(async () => {
      await user.reload() // cập nhật dữ liệu mới nhất từ Firebase
      if (user.emailVerified) {
        toast.success('Email đã được xác thực!')
        clearInterval(interval)
        navigate('/login') // chuyển sang trang login
      }
    }, 3000) // kiểm tra mỗi 3 giây

    return () => clearInterval(interval)
  }, [user, navigate])
  // 🔥 2. Gửi lại email xác thực
  const handleSendVerify = async () => {
    if (!user) {
      toast.error('Bạn chưa đăng nhập!')
      return
    }
    try {
      setLoading(true)
      await sendEmailVerification(user)
      toast.success('Email xác thực đã được gửi! Kiểm tra hộp thư, kể cả thư rác.')
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
        {user ? (
          <>
            Email hiện tại: <strong>{user.email}</strong>
            <br />
            Kiểm tra hộp thư và nhấn vào liên kết xác thực.
            <br />
            Trang sẽ tự chuyển khi bạn xác thực thành công!
          </>
        ) : (
          'Bạn cần đăng nhập để gửi email xác thực.'
        )}
      </p>

      <Button onClick={handleSendVerify} className='w-full cursor-pointer' disabled={!user || loading}>
        {loading ? <Spinner>Đang gửi...</Spinner> : 'Gửi lại email xác thực'}
      </Button>
    </div>
  )
}
