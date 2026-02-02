import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { auth } from '@/firebase/firebase-config'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

const SignUpPage = () => {
  const provider = new GoogleAuthProvider()

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider)

      // lấy user từ google
      const user = result.user

      // lưu vào context
      // setUser(user)

      // lưu vào Firestore nếu muốn
      // const userRef = collection(db, 'users')
      // await addDoc(userRef, {
      //   id: user.uid,
      //   email: user.email,
      //   displayName: user.displayName,
      //   photoURL: user.photoURL
      // })
    } catch (error: any) {
      alert(error.code)
    }
  }
  return (
    <div className='min-h-screen p-10'>
      <div className='container w-full mx-auto max-w-5xl p-5 '>
        <img srcSet='/src/assets/logo.png 2x' alt='monkey-blog' className='mx-auto mb-10' />
        <h1 className='text-center text-xl text-primary font-semibold mb-5'>Tạo một tài khoản</h1>
        <form>
          <div className='flex flex-col w-full max-w-sm items-start gap-3 mx-auto mb-5'>
            <Label htmlFor='fullname' className='font-medium text-sm'>
              Full Name *
            </Label>
            <Input type='text' id='fullname' placeholder='Luan' className='py-6 px-3.5 text-xs' />
            <Label htmlFor='email' className='font-medium text-sm'>
              Email *
            </Label>
            <Input type='text' id='email' placeholder='123@gmail.com' className='py-6 px-3.5 text-xs' />
            <Label htmlFor='password' className='font-medium text-sm'>
              Mật khẩu *
            </Label>
            <Input type='text' id='password' placeholder='tạo mật khẩu' className='py-6 px-3.5 text-xs' />
            <Button size='lg' className='w-full py-6 px-3.5'>
              Tiếp Tục
            </Button>
            <p className='text-xl mx-auto block'>Bạn đã có tài khoản? Hãy đăng nhập</p>
          </div>
          <h2 className='text-center text-xl text-primary font-semibold mb-5'>hoặc</h2>
          {/* ------- NÚT GOOGLE ------- */}
          <div className='flex justify-center max-w-sm mx-auto w-full'>
            <Button
              variant='secondary'
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
