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
            createdAt: data.createdAt?.toDate()
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
