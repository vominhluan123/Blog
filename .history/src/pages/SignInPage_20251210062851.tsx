import Spinner from '@/components/loading-button/Spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { useAuth } from '@/contexts/useAuth'

const SignInPage = () => {
  const { user } = useAuth()
  return (
    <div>
      {' '}
      <div className='min-h-screen p-10'>
        <div className='container w-full mx-auto max-w-5xl p-5 '>
          <img srcSet='/src/assets/logo.png 2x' alt='monkey-blog' className='mx-auto mb-10' />
          <h1 className='text-center text-xl text-primary font-semibold mb-5'>Tạo một tài khoản</h1>
          <form onSubmit={handleSubmit(handleSignUp)}>
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
                placeholder='tạo mật khẩu'
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
    </div>
  )
}

export default SignInPage
