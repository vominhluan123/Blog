import AuthLayout from '@/components/auth/AuthLayout'
import Spinner from '@/components/loading-button/Spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { useAuth } from '@/contexts/useAuth'
import { USERS_COLLECTION } from '@/firebase/db'
import { auth, db } from '@/firebase/firebase-config'
import { useGoogleLogin } from '@/firebase/login-google'
import { useTitle } from '@/hooks/useTitle'
import { cn } from '@/lib/utils'
import { getOrCreateUniqueSlug } from '@/utils/slug'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import * as z from 'zod'

const schema = z.object({
  fullname: z.string().min(1, 'Tên không được để trống').max(50, 'Họ tối đa 50 ký tự').trim(),
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

const RegisterPage = () => {
  useTitle('Đăng ký - Blog')
  const formInputClass = cn(
    'w-full! rounded-md border',
    'bg-background/80 text-foreground placeholder-muted-foreground/70',
    'transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-background w-64 backdrop-blur-sm',
    'dark:bg-background/50 dark:border-primary/20',
    'dark:focus:ring-primary/70 dark:focus:shadow-lg dark:focus:shadow-primary/30'
  )
  const { loginWithGoogle } = useGoogleLogin()
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange'
  })
  const handleSignUp: SubmitHandler<FormData> = async (data) => {
    try {
      // Xoá khoảng trắng và Tự động viết hoa chữ cái đầu mỗi từ
      const normalizedName = data.fullname
        .trim()
        .replace(/\s+/g, ' ')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
      // 1) Tạo user bằng email/password
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
      // lấy user từ firebase
      const user = userCredential.user
      // 2) Cập nhật displayName (hiển thị)
      await updateProfile(user, { displayName: normalizedName })
      await sendEmailVerification(user)
      const updatedUser = auth.currentUser! // chắc chắn có
      // 4) Lưu user vào Firestore
      const slug = await getOrCreateUniqueSlug(normalizedName)
      const userRef = doc(db, USERS_COLLECTION, user.uid)
      await setDoc(
        userRef,
        {
          uid: user.uid,
          fullname: normalizedName,
          displayName: normalizedName, // thêm để đồng bộ với AuthProvider & Google
          email: data.email,
          photoURL: user.photoURL || null,
          role: 'USER', // đồng bộ với Role.USER
          status: 'ACTIVE', // đồng bộ với UserStatus.ACTIVE
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          loginMethods: ['password'],
          slug // optional, để track
        },
        { merge: true }
      ) // ← merge: true để an toàn nếu document đã tồn tại (hiếm trong register)
      // 5. Lưu vào context
      setUser(updatedUser)
      // 6) Thông báo và chuyển hướng
      toast.success('Đăng ký thành công. Vui lòng kiểm tra email để xác thực.')
      setTimeout(() => navigate('/verify-email', { replace: true }), 800)
    } catch (error: any) {
      // xử lý lỗi
      if (error.code === 'auth/email-already-in-use') {
        return setError('email', { type: 'server', message: 'Email đã tồn tại' })
      } else if (error.code === 'auth/invalid-email') {
        return setError('email', { type: 'server', message: 'Email không hợp lệ' })
      } else {
        setError('root', { type: 'server', message: 'Vui lòng thử lại' })
      }
    }
  }
  return (
    <AuthLayout title='Tạo một tài khoản'>
      <form onSubmit={handleSubmit(handleSignUp)}>
        <div className='flex flex-col w-full max-w-sm items-start gap-3 mx-auto mb-5'>
          <Label htmlFor='fullname' className='font-medium text-sm'>
            Họ và Tên *
          </Label>
          <Input
            type='text'
            autoFocus
            id='fullname'
            placeholder='Nguyen van A'
            disabled={isSubmitting}
            className={cn(formInputClass, errors.fullname && 'border-destructive! focus-visible:ring-destructive/50!')}
            autoComplete='name'
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
            autoComplete='email'
            className={cn(formInputClass, errors.email && 'border-destructive! focus-visible:ring-destructive/50!')}
          />
          {errors?.email && <span className='text-red-500 text-sm'>{errors.email.message}</span>}
          <Label htmlFor='password' className='font-medium text-sm'>
            Mật khẩu *
          </Label>
          <PasswordInput
            id='password'
            className={cn(formInputClass, errors.password && 'border-destructive! focus-visible:ring-destructive/50!')}
            placeholder='tạo mật khẩu'
            {...register('password')}
            disabled={isSubmitting}
            autoComplete='new-password'
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
            Bạn đã có tài khoản?{' '}
            <Link to='/login' className='text-primary font-medium hover:underline'>
              Hãy đăng nhập
            </Link>
          </p>
          {errors.root && <p className='text-red-500 text-sm text-center'>{errors.root.message}</p>}
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
            <img src='/public/google-icon.png' className='w-5 h-5' alt='google' />
            Đăng nhập bằng Google
          </Button>
        </div>
      </form>
    </AuthLayout>
  )
}

export default RegisterPage
