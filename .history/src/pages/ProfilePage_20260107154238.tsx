'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { doc, getDoc } from 'firebase/firestore'
import { useAuthState } from 'react-firebase-hooks/auth' // nếu bạn dùng hook này
import { auth, db } from '@/lib/firebase' // import từ config firebase của bạn

// Các component shadcn
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner' // optional, dùng để thông báo

// ── Schema validation với Zod ──
const profileSchema = z.object({
  displayName: z.string().min(2, { message: 'Tên hiển thị ít nhất 2 ký tự' }).max(50),
  username: z
    .string()
    .min(3, { message: 'Username ít nhất 3 ký tự' })
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, 'Chỉ được chứa chữ, số và dấu gạch dưới'),
  email: z.string().email({ message: 'Email không hợp lệ' }),
  bio: z.string().max(280, { message: 'Giới thiệu tối đa 280 ký tự' }).optional()
})

type ProfileFormValues = z.infer<typeof profileSchema>

// ── Default values ban đầu ──
const defaultValues: ProfileFormValues = {
  displayName: '',
  username: '',
  email: '',
  bio: ''
}

export default function ProfilePage() {
  const [user, loadingAuth] = useAuthState(auth) // hoặc dùng onAuthStateChanged nếu không dùng hook
  const [isLoading, setIsLoading] = useState(true)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
    mode: 'onChange' // validate realtime khi user gõ
  })

  // Load dữ liệu từ Firestore khi có user
  useEffect(() => {
    if (!user) return

    const fetchProfile = async () => {
      try {
        setIsLoading(true)
        const userDocRef = doc(db, 'users', user.uid)
        const userSnap = await getDoc(userDocRef)

        if (userSnap.exists()) {
          const data = userSnap.data()
          form.reset({
            displayName: data.displayName || user.displayName || '',
            username: data.username || '',
            email: data.email || user.email || '',
            bio: data.bio || ''
          })
        } else {
          // Nếu chưa có doc → dùng thông tin từ auth
          form.reset({
            displayName: user.displayName || '',
            username: '',
            email: user.email || '',
            bio: ''
          })
          toast.warning('Hồ sơ chưa được thiết lập đầy đủ')
        }
      } catch (error) {
        console.error('Lỗi load profile:', error)
        toast.error('Không thể tải thông tin hồ sơ')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [user, form])

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return

    try {
      // Sau này bạn sẽ update lên Firestore ở đây
      // Ví dụ:
      // await updateDoc(doc(db, "users", user.uid), values);

      toast.success('Đã cập nhật thông tin!')
      console.log('Submitted:', values)
    } catch (error) {
      toast.error('Cập nhật thất bại')
      console.error(error)
    }
  }

  if (loadingAuth || isLoading) {
    return (
      <div className='container max-w-2xl py-10'>
        <Card>
          <CardHeader>
            <Skeleton className='h-8 w-48' />
            <Skeleton className='h-4 w-72' />
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='space-y-4'>
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
            </div>
            <Skeleton className='h-32 w-full' />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className='container max-w-2xl py-10'>
        <Card>
          <CardHeader>
            <CardTitle>Vui lòng đăng nhập</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className='container max-w-2xl py-10'>
      <Card>
        <CardHeader>
          <CardTitle>Chỉnh sửa hồ sơ</CardTitle>
          <CardDescription>Cập nhật thông tin cá nhân của bạn</CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
              {/* ── Section 1: Thông tin cơ bản ── */}
              <div className='space-y-6'>
                <h3 className='text-lg font-medium'>Thông tin cơ bản</h3>

                <FormField
                  control={form.control}
                  name='displayName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên hiển thị</FormLabel>
                      <FormControl>
                        <Input placeholder='Nguyễn Văn A' {...field} />
                      </FormControl>
                      <FormDescription>Tên này sẽ hiển thị công khai</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='username'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder='nguyenvana' {...field} />
                      </FormControl>
                      <FormDescription>Dùng để đăng nhập và định danh</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder='example@gmail.com' {...field} disabled />
                      </FormControl>
                      <FormDescription>Email không thể thay đổi</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ── Section 2: Giới thiệu cá nhân ── */}
              <div className='space-y-6'>
                <h3 className='text-lg font-medium'>Giới thiệu cá nhân</h3>

                <FormField
                  control={form.control}
                  name='bio'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giới thiệu</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Mình là một lập trình viên yêu thích React và TypeScript...'
                          className='resize-none'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Tối đa 280 ký tự</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='flex justify-end gap-4'>
                <Button type='button' variant='outline' onClick={() => form.reset()}>
                  Hủy
                </Button>
                <Button type='submit' disabled={!form.formState.isDirty}>
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
