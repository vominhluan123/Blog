import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { auth } from '@/firebase/firebase-config'
import { sendEmailVerification, onAuthStateChanged } from 'firebase/auth'
import { toast } from 'sonner'
import Spinner from '@/components/loading-button/Spinner'
import { Button } from '@/components/ui/button'
import { useTitle } from '@/hooks/useTitle'

export default function VerifyEmailPage() {
  useTitle('Xác thực email - Blog')
  const navigate = useNavigate()
  const [user, setUser] = useState(auth.currentUser)
  const [loading, setLoading] = useState(false)

  // 1. Lắng nghe auth state thay đổi (khi reload trang hoặc login lại)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (currentUser?.emailVerified) {
        toast.success('Email đã được xác thực!')
        navigate('/login', { replace: true }) // hoặc '/' nếu bạn muốn
      }
    })

    return () => unsubscribe()
  }, [navigate])

  // 2. Kiểm tra định kỳ (fallback khi không reload trang)
  useEffect(() => {
    if (!user) return

    const interval = setInterval(async () => {
      try {
        await user.reload()
        if (user.emailVerified) {
          toast.success('Email đã được xác thực!')
          clearInterval(interval)
          navigate('/login', { replace: true })
        }
      } catch (err) {
        console.error('Reload error:', err)
      }
    }, 5000) // tăng lên 5 giây để tránh gọi quá nhiều

    return () => clearInterval(interval)
  }, [user, navigate])

  const handleSendVerify = async () => {
    if (!user) {
      toast.error('Bạn chưa đăng nhập!')
      return
    }
    try {
      setLoading(true)
      await sendEmailVerification(user)
      toast.success('Đã gửi lại email xác thực! Kiểm tra hộp thư và spam.')
    } catch (err: any) {
      toast.error(err.message || 'Gửi email thất bại. Thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className='max-w-sm mx-auto mt-10 text-center'>
        <h2 className='text-xl font-semibold mb-4'>Xác thực email</h2>
        <p>Bạn cần đăng nhập để tiếp tục.</p>
        <Button onClick={() => navigate('/login')} className='mt-4'>
          Đi đến trang đăng nhập
        </Button>
      </div>
    )
  }

  return (
    <div className='max-w-sm mx-auto mt-10'>
      <h2 className='text-xl font-semibold mb-4'>Xác thực email</h2>
      <p className='text-sm mb-6'>
        Chúng tôi đã gửi email xác thực đến <strong>{user.email}</strong>.<br />
        Vui lòng kiểm tra hộp thư (và thư rác/spam).
        <br />
        Trang sẽ tự động chuyển hướng khi bạn xác thực thành công!
      </p>

      <Button onClick={handleSendVerify} disabled={loading} className='w-full'>
        {loading ? <Spinner>Đang gửi...</Spinner> : 'Gửi lại email xác thực'}
      </Button>

      <p className='text-xs text-muted-foreground mt-6 text-center'>
        Sau khi nhấn link trong email, bạn có thể <strong>refresh trang</strong> hoặc <strong>đăng nhập lại</strong> để
        xác nhận nhanh hơn.
      </p>
    </div>
  )
}
