import AuthLayout from '@/components/auth/AuthLayout'
import Spinner from '@/components/loading-button/Spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { useAuth } from '@/contexts/useAuth'
import { auth } from '@/firebase/firebase-config'
import { useGoogleLogin } from '@/firebase/login-google'
import { useTitle } from '@/hooks/useTitle'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import * as z from 'zod'
const schema = z.object({
  email: z.string().email('Email không hợp lệ').min(1, 'Email không được để trống').trim(),
  password: z.string().min(1, 'Mật khẩu không được để trống')
})
export type FormData = z.infer<typeof schema>
const LoginPage = () => {
  useTitle('Đăng nhập - Blog')
  const formInputClass = cn(
    'w-full! rounded-md border',
    'bg-background/80 text-foreground placeholder-muted-foreground/70',
    'transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-background w-64 backdrop-blur-sm',
    'dark:bg-background/50 dark:border-primary/20',
    'dark:focus:ring-primary/70 dark:focus:shadow-lg dark:focus:shadow-primary/30'
  )
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
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
  const handleSignIn: SubmitHandler<FormData> = async (data: FormData) => {
    try {
   user = await signInWithEmailAndPassword(auth, data.email, data.password)
      // Nếu email chưa verify → chặn login, yêu cầu verify
      if (!user.user.emailVerified) {
        toast.error('Email chưa xác thực! Vui lòng kiểm tra email.')
        navigate('/verify-email', { replace: true })
        return
      }
      // 5. Lưu vào context
      setUser(user.user)
      toast.success('Đăng nhập thành công')
      setTimeout(() => navigate('/'), 800)
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return setError('email', { type: 'server', message: 'Email không tồn tại' })
      }
      if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
        return setError('password', { type: 'server', message: 'Email hoặc mật khẩu sai' })
      } else {
        return setError('root', { type: 'server', message: 'Vui lòng thử lại' })
      }
    }
  }
  return (
    <AuthLayout title='Đăng nhập tài khoản'>
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
            autoComplete='email'
            autoFocus
            className={cn(formInputClass, errors.email && 'border-destructive! focus-visible:ring-destructive/50!')}
          />
          {errors?.email && <span className='text-red-500 text-sm'>{errors.email.message}</span>}
          <Label htmlFor='password' className='font-medium text-sm'>
            Mật khẩu *
          </Label>
          <PasswordInput
            id='password'
            className={cn(formInputClass, errors.email && 'border-destructive! focus-visible:ring-destructive/50!')}
            placeholder='*******'
            {...register('password')}
            disabled={isSubmitting}
            autoComplete='current-password'
          />
          {errors?.password && <span className='text-red-500 text-sm'>{errors.password.message}</span>}
          <Button
            size={'lg'}
            className={`w-full cursor-pointer flex font-semibold items-center justify-center  ${
              isSubmitting ? ' cursor-not-allowed' : ' text-white cursor-pointer'
            }`}
            type='submit'
            disabled={isSubmitting}
          >
            {isSubmitting ? <Spinner>Vui lòng đợi</Spinner> : 'Tiếp Tục'}
          </Button>
          <div className='flex justify-between w-full text-sm'>
            <Link to='/forgot-password' className='text-primary font-medium hover:underline'>
              Quên mật khẩu?
            </Link>
            {/* Added forgot password */}
            <p>
              Bạn chưa có tài khoản?{' '}
              <Link to='/register' className='text-primary font-medium hover:underline'>
                Đăng ký ngay
              </Link>
            </p>
          </div>
          {errors.root && <p className='text-red-500 text-sm text-center mt-2'>{errors.root.message}</p>}
        </div>
        <h2 className='text-center text-xl text-primary font-semibold mb-5'>hoặc</h2>
        {/* ------- NÚT GOOGLE ------- */}
        <div className='flex justify-center max-w-sm mx-auto w-full'>
          <Button
            variant='default'
            className='px-10 cursor-pointer py-6 flex gap-2 items-center w-full'
            type='button'
            onClick={loginWithGoogle}
            disabled={isSubmitting}
          >
            <img src='/google-icon.png' className='w-5 h-5' alt='google' />
            Đăng nhập bằng Google
          </Button>
        </div>
      </form>
    </AuthLayout>
  )
}

export default LoginPage
