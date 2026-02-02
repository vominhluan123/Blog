import { Input } from '@/components/ui/input'

const SignUpPage = () => {
  return (
    <div className='min-h-screen p-10'>
      <div className='container w-full mx-auto max-w-5xl p-5 '>
        <img srcSet='/src/assets/logo.png 2x' alt='monkey-blog' className='mx-auto mb-10' />
        <h1 className='text-center text-xl text-primary font-semibold'>Tạo một tài khoản</h1>
        <form>
          <div className='flex w-full max-w-sm items-start gap-3'>
            <label htmlFor='fullname'>Full Name *</label>
            <Input type='text' id='fullname' placeholder='Luan' />
          </div>
        </form>
      </div>
    </div>
  )
}

export default SignUpPage
