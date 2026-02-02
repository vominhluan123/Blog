import { Input } from '@/components/ui/input'

const SignUpPage = () => {
  return (
    <div className='min-h-screen p-10'>
      <div className='container w-full mx-auto max-w-5xl p-5 '>
        <img srcSet='/src/assets/logo.png 2x' alt='monkey-blog' className='mx-auto mb-10' />
        <h1 className='text-center text-xl text-primary font-semibold mb-5'>Tạo một tài khoản</h1>
        <form>
          <div className='flex flex-col w-full max-w-s items-start gap-3'>
            <label htmlFor='fullname' className='font-medium text-[14px]'>
              Full Name *
            </label>
            <Input type='text' id='fullname' placeholder='Luan' className='py-6 px-3.5' />
          </div>
        </form>
      </div>
    </div>
  )
}

export default SignUpPage
