import Spinner from '@/components/loading-button/Spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { useAuth } from '@/contexts/useAuth'
import { auth, db } from '@/firebase/firebase-config'
import { useGoogleLogin } from '@/firebase/login-google'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import * as z from 'zod'

const schema = z.object({
  fullname: z.string().min(1, 'Họ không được để trống').max(10, 'Họ tối đa 10 ký tự').trim(),
  email: z.string().email('Email không hợp lệ').min(1, 'Email không được để trống').trim(),
  password: z
    .string()
    .min(6, 'Mật khẩu tối thiểu 6 ký tự')
    .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ cái in hoa')
    .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ cái thường')
    .regex(/\d/, 'Mật khẩu phải có ít nhất 1 chữ số')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt')
})
export type FormData = z.infer<typeof schema>

const SignUpPage = () => {
  const { loginWithGoogle } = useGoogleLogin()
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, isSubmitted }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange'
  })
  const handleSignUp: SubmitHandler<FormData> = async (data) => {
    try {
      // 1. Đăng ký
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
      // lấy user từ firebase
      const user = userCredential.user
      // 2. Cập nhật displayName
      if (auth.currentUser) await updateProfile(user, { displayName: data.fullname })
      // 3. Reload để lấy thông tin mới nhất
      await user.reload()

      // lưu vào firebase
      const userRef = collection(db, 'users')
      await addDoc(userRef, {
        uid: user.uid,
        fullname: data.fullname,
        email: data.email,
        photoURL: user.photoURL || null,
        provider: user.providerId,
        createdAt: serverTimestamp()
      })

      // 5. Lưu vào context
      setUser({ ...user })

      // thông báo đăng ký thành công
      toast.success('Đăng ký thành công')
      // chuyển trang chủ
      navigate('/')
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast.warning('Email đã tồn tại!')
        return
      }

      if (error.code === 'auth/invalid-email') {
        toast.error('Email không hợp lệ!')
        return
      }
      toast.info('Vui lòng thử lại!')
    }
  }
  return (
    <div className='min-h-screen p-10'>
      <div className='container w-full mx-auto max-w-5xl p-5 '>
        <img srcSet='/src/assets/logo.png 2x' alt='monkey-blog' className='mx-auto mb-10' />
        <h1 className='text-center text-xl text-primary font-semibold mb-5'>Tạo một tài khoản</h1>
        <form onSubmit={handleSubmit(handleSignUp)}>
          <div className='flex flex-col w-full max-w-sm items-start gap-3 mx-auto mb-5'>
            <Label htmlFor='fullname' className='font-medium text-sm'>
              Full Name *
            </Label>
            <Input
              type='text'
              autoFocus
              id='fullname'
              placeholder='Luan'
              disabled={isSubmitting}
              className={`${errors.fullname ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              {...register('fullname')}
            />
            {errors?.fullname && <span className='text-red-500 text-sm'>{errors.fullname.message}</span>}
            <Label htmlFor='email' className='font-medium text-sm'>
              Email *
            </Label>
            <Input
              type='text'
              id='email'
              placeholder='123@gmail.com'
              {...register('email')}
              disabled={isSubmitting}
              className={`${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            />
            {errors?.email && <span className='text-red-500 text-sm'>{errors.email.message}</span>}
            <Label htmlFor='password' className='font-medium text-sm'>
              Mật khẩu *
            </Label>
            <PasswordInput
              id='password'
              className={`${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              placeholder='tạo mật khẩu'
              {...register('password')}
              disabled={isSubmitting}
            />
            {errors?.password && <span className='text-red-500 text-sm'>{errors.password.message}</span>}
            <Button size='lg' className='w-full py-6 px-3.5 cursor-pointer font-semibold' type='submit'>
              <Spinner>Vui long dôi</Spinner>
              {/* {isSubmitting ? <Spinner>Vui lòng đợi</Spinner> : 'Tiếp Tục'} */}
            </Button>
            <p className='text-sm mx-auto block'>Bạn đã có tài khoản? Hãy đăng nhập</p>
          </div>
          <h2 className='text-center text-xl text-primary font-semibold mb-5'>hoặc</h2>
          {/* ------- NÚT GOOGLE ------- */}
          <div className='flex justify-center max-w-sm mx-auto w-full'>
            <Button
              variant='outline'
              className='px-10 cursor-pointer py-6 flex gap-2 items-center w-full'
              type='button'
              onClick={loginWithGoogle}
            >
              <img src='/src/assets/google-icon.png' className='w-5 h-5' alt='google' />
              Đăng nhập bằng Google
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SignUpPage
