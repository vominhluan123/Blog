import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { auth } from '@/firebase/firebase-config'
import { zodResolver } from '@hookform/resolvers/zod'
import { sendPasswordResetEmail } from 'firebase/auth'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

const schema = z.object({
  email: z.string().email('Email không hợp lệ')
})

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(schema)
  })

  const onSubmit = async ({ email }: { email: string }) => {
    try {
      await sendPasswordResetEmail(auth, email)
      toast.success('Đã gửi email khôi phục mật khẩu! Kiểm tra hộp thư của bạn.')
    } catch (err) {
      toast.error('Không thể gửi email. Hãy thử lại.')
    }
  }

  return (
    <div className='max-w-sm mx-auto mt-10'>
      <h2 className='text-xl font-semibold mb-4'>Quên mật khẩu</h2>

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
        <div>
          <Label>Email</Label>
          <Input
            type='email'
            placeholder='email@gmail.com'
            {...register('email')}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <p className='text-red-500 text-sm'>{errors.email.message}</p>}
        </div>

       <Button
            size={'lg'}
            className={`w-full cursor-pointer flex font-semibold items-center justify-center  ${
              isSubmitting ? ' cursor-not-allowed' : ' text-white cursor-pointer'
            }`}
            type='submit'
          ><
      </form>
    </div>
  )
}
