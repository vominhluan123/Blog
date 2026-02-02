import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/useAuth'
import { POSTS_COLLECTION, Role, USERS_COLLECTION } from '@/firebase/db'
import { db } from '@/firebase/firebase-config'
import { cn } from '@/lib/utils'
import { getOrCreateUniqueSlug } from '@/utils/slug'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateProfile } from 'firebase/auth'
import { collection, doc, getDoc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore'
import { Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import * as z from 'zod'

const profileSchema = z.object({
  displayName: z.string().min(3, 'Tên hiển thị phải ít nhất 3 ký tự')
})
const formInputClass = cn(
  ' rounded-md border  py-6',
  'bg-background/80 text-foreground placeholder-muted-foreground/70',
  'transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-background backdrop-blur-sm',
  'dark:bg-background/50 dark:border-primary/20'
)
type ProfileFormData = z.infer<typeof profileSchema>

const Profile = () => {
  const { user, loading: authLoading } = useAuth()
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileData, setProfileData] = useState<{
    displayName?: string
    photoURL?: string
    role?: Role
    createdAt?: Date
    slug?: string
  } | null>(null)

  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const CLOUDINARY_CLOUD_NAME = 'dhxhcwdo5'
  const CLOUDINARY_UPLOAD_PRESET = 'blog_upload_img'
  const navigate = useNavigate()

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: '' }
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset
  } = form

  // Theo dõi thay đổi avatar để biết có thay đổi không
  const hasAvatarChanged = !!avatarFile || !!previewImage

  // Disable nút Lưu nếu không có thay đổi gì
  const isSaveDisabled = !isDirty && !hasAvatarChanged

  // Lấy dữ liệu profile từ Firestore
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      try {
        const userRef = doc(db, USERS_COLLECTION, user.uid)
        const userDoc = await getDoc(userRef)

        if (userDoc.exists()) {
          const data = userDoc.data()
          const fetchedData = {
            displayName: data.displayName,
            photoURL: data.photoURL,
            role: (data.role as Role) || Role.USER,
            createdAt: data.createdAt?.toDate(),
            slug: data.slug || undefined
          }
          setProfileData(fetchedData)
          reset({ displayName: fetchedData.displayName || '' })
        }
      } catch (error) {
        console.error('Lỗi lấy profile:', error)
        toast.error('Không thể tải thông tin cá nhân')
      } finally {
        setProfileLoading(false)
      }
    }

    fetchProfile()
  }, [user, reset])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setPreviewImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return toast.error('Bạn chưa đăng nhập!')

    setIsSubmitting(true)

    try {
      let photoURL = profileData?.photoURL
      if (avatarFile) {
        const formData = new FormData()
        formData.append('file', avatarFile)
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData
        })
        const result = await response.json()

        if (result.secure_url) {
          photoURL = result.secure_url
        } else {
          throw new Error('Upload avatar thất bại')
        }
      }
      let slug = profileData?.slug
      if (data.displayName !== profileData?.displayName) {
        slug = await getOrCreateUniqueSlug(data.displayName, user.uid)
      }
      await updateProfile(user, {
        displayName: data.displayName,
        photoURL: photoURL || null
      })
      const userRef = doc(db, USERS_COLLECTION, user.uid)
      await updateDoc(userRef, {
        displayName: data.displayName,
        slug,
        photoURL,
        updatedAt: new Date()
      })
      const postsQuery = query(collection(db, POSTS_COLLECTION), where('authorId', '==', user.uid))
      const postsSnapshot = await getDocs(postsQuery)

      const batch = writeBatch(db) // Dùng batch để update nhiều doc cùng lúc

      postsSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          authorName: data.displayName,
          authorPhotoURL: photoURL || null,
          updatedAt: new Date()
        })
      })

      await batch.commit()
      setProfileData((prev) => ({ ...prev, displayName: data.displayName, photoURL }))
      reset({ displayName: data.displayName })
      setPreviewImage(null)
      setAvatarFile(null)
      toast.success('Cập nhật profile thành công!')
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra!')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading || profileLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='space-y-8 w-full max-w-md'>
          <Skeleton className='h-12 w-3/4 mx-auto rounded-lg' />
          <Skeleton className='h-64 w-full rounded-xl' />
          <Skeleton className='h-10 w-full rounded-md' />
          <Skeleton className='h-10 w-full rounded-md' />
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen py-12 bg-background'>
      <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8'>
        <Card className='border-none shadow-lg'>
          <CardHeader className='text-center'>
            <CardTitle className='text-3xl font-bold'>Hồ sơ cá nhân</CardTitle>
            <CardDescription>Quản lý thông tin của bạn</CardDescription>
          </CardHeader>

          <CardContent className='space-y-8'>
            {/* Avatar */}
            <div className='flex flex-col items-center space-y-4'>
              <div className='relative'>
                <Avatar className='h-32 w-32 ring-2 ring-primary/20'>
                  <AvatarImage
                    src={previewImage || profileData?.photoURL || 'https://github.com/shadcn.png'}
                    alt={profileData?.displayName}
                  />
                  <AvatarFallback>{profileData?.displayName?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <label className='absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors'>
                  <Upload className='h-5 w-5' />
                  <input type='file' accept='image/*' className='hidden' onChange={handleAvatarChange} />
                </label>
              </div>
              <p className='text-sm text-muted-foreground'>Nhấn vào biểu tượng upload để thay đổi ảnh đại diện</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
              <div className='space-y-2'>
                <Label htmlFor='displayName' className='text-base font-medium'>
                  Tên hiển thị
                </Label>
                <Input
                  id='displayName'
                  {...register('displayName')}
                  placeholder='Nhập tên hiển thị...'
                  className={cn(
                    formInputClass,
                    errors.displayName && 'border-destructive focus-visible:ring-destructive/50'
                  )}
                  disabled={isSubmitting}
                />
                {errors.displayName && <p className='text-sm text-destructive'>{errors.displayName.message}</p>}
              </div>

              <div className='space-y-2'>
                <Label className='text-base font-medium'>Email</Label>
                <Input value={user?.email || ''} disabled className='bg-muted cursor-not-allowed' />
              </div>

              <div className='space-y-2'>
                <Label className='text-base font-medium'>Vai trò</Label>
                <Input
                  value={profileData?.role === Role.ADMIN ? 'Quản trị viên' : 'Người dùng'}
                  disabled
                  className='bg-muted cursor-not-allowed'
                />
              </div>

              <div className='flex justify-end gap-4 pt-6 border-t'>
                <Button type='button' onClick={() => navigate(-1)} disabled={isSubmitting}>
                  Quay lại
                </Button>
                <Button variant='secondary' type='submit' disabled={isSubmitting || isSaveDisabled}>
                  {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Profile
 còn phần tạo tài khoản nữa: import AuthLayout from '@/components/auth/AuthLayout'
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