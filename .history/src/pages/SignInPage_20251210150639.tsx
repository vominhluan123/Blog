import Spinner from '@/components/loading-button/Spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { useAuth } from '@/contexts/useAuth'
import { auth } from '@/firebase/firebase-config'
import { useGoogleLogin } from '@/firebase/login-google'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import z from 'zod'
import {  } from 'react-hook-form'
const schema = z.object({
  email: z.string().email('Email không hợp lệ').min(1, 'Email không được để trống').trim(),
  password: z.string().min(1, 'Mật khẩu không được để trống')
})
export type FormData = z.infer<typeof schema>
const SignInPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  console.log('🚀 ~ SignInPage ~ user:', user)
  const { loginWithGoogle } = useGoogleLogin()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange'
  })
  const handleSignIn = async (data: FormData) => {
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password)
      navigate('/')
    } catch (error: any) {
      const code = error.code
        if (code === 'auth/user-not-found') {
          setError('email', {
            type: 'server',
            message: 'Email không tồn tại'
          })
        }
    }
  }
  return (
    <div>
      <div className='min-h-screen p-10'>
        <div className='container w-full mx-auto max-w-5xl p-5 '>
          <img srcSet='/src/assets/logo.png 2x' alt='monkey-blog' className='mx-auto mb-10' />
          <h1 className='text-center text-xl text-primary font-semibold mb-5'> Đăng nhập tài khoản</h1>
          <form onSubmit={handleSubmit(handleSignIn)}>
            <div className='flex flex-col w-full max-w-sm items-start gap-3 mx-auto mb-5'>
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
                placeholder='*******'
                {...register('password')}
                disabled={isSubmitting}
              />
              {errors?.password && <span className='text-red-500 text-sm'>{errors.password.message}</span>}
              <Button
                size={'lg'}
                className={`w-full cursor-pointer flex font-semibold items-center justify-center  ${
                  isSubmitting ? ' cursor-not-allowed' : ' text-white cursor-pointer'
                }`}
                type='submit'
              >
                {isSubmitting ? <Spinner>Vui lòng đợi</Spinner> : 'Tiếp Tục'}
              </Button>
              <p className='text-sm mx-auto block'>
                Bạn chưa có tài khoản?{' '}
                <Link to='/' className='text-primary font-medium hover:underline'>
                  Đăng ký ngay
                </Link>
              </p>
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
    </div>
  )
}

export default SignInPage
