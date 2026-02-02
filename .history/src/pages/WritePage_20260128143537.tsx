import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/contexts/useAuth'
import { DEFAULT_POST_STATUS, POSTS_COLLECTION, type Post } from '@/firebase/db'
import { db } from '@/firebase/firebase-config'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { addDoc, collection, Timestamp } from 'firebase/firestore'
import { Upload, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import ReactQuill,{Quill} from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { useNavigate } from 'react-router'
import slugify from 'slugify'
import ImageUploader from 'quill-image-uploader'

import { toast } from 'sonner'
import * as z from 'zod'
Quill.register('modules/imageUploader', ImageUploader)

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }], // heading 1-3
    ['bold', 'italic', 'underline'], // cơ bản
    ['link', 'image'], // chèn link
    [{ list: 'ordered' }, { list: 'bullet' }], // danh sách
    ['clean'] // xóa format
  ]
}
const formats = ['header', 'bold', 'italic', 'underline', 'link', 'list', 'bullet']
// Schema Zod
const schema = z
  .object({
    title: z.string().min(5, 'Tiêu đề phải ít nhất 5 ký tự').max(200, 'Tiêu đề tối đa 200 ký tự'),
    content: z.string().min(1, 'Nội dung không được để trống').max(10000, 'Nội dung quá dài (tối đa 10.000 ký tự)'),
    tags: z.array(z.string().min(2)).optional()
  })
  .superRefine((data, ctx) => {
    // Lấy plain text từ content HTML
    // Vì Quill trả về string, ta cần parse tạm để lấy text (cách đơn giản nhất)
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = data.content || ''
    const plainText = tempDiv.textContent || tempDiv.innerText || ''

    if (plainText.trim().length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 10,
        type: 'string',
        inclusive: true,
        message: 'Nội dung phải có ít nhất 10 ký tự',
        path: ['content'],
        origin: 'string'
      })
    }
  })

// minhluan2554@gmail.com
// 0909675400Luan@
type FormData = z.infer<typeof schema>

const CLOUDINARY_CLOUD_NAME = 'dhxhcwdo5'
const CLOUDINARY_UPLOAD_PRESET = 'blog_upload_img'

const WritePage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tags: [] },
    mode: 'onChange'
  })
  const formInputClass = cn(
    '!w-full rounded-md border !text-xl py-6',
    'bg-background/80 text-foreground placeholder-muted-foreground/70',
    'transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-background backdrop-blur-sm',
    'dark:bg-background/50 dark:border-primary/20',
    'dark:focus:ring-primary/70 dark:focus:shadow-lg dark:focus:shadow-primary/30'
  )
  const tags = watch('tags') || []
  const [newTag, setNewTag] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null) // Lưu file tạm
  const [uploadProgress, setUploadProgress] = useState(0)
  const quillRef = useRef<ReactQuill>(null)
  useEffect(() => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor() // lấy Quill instance
      const editorElement = editor.root // chính là .ql-editor
      if (editorElement) {
        editorElement.setAttribute('spellcheck', 'false')
        editorElement.setAttribute('autocorrect', 'off')
        editorElement.setAttribute('autocapitalize', 'off')
        editorElement.setAttribute('lang', 'vi') // optional, giúp browser biết ngôn ngữ
      }
    }
  }, [])
  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const input = e.currentTarget.value.trim()
      if (input && !tags.includes(input)) {
        setValue('tags', [...tags, input])
        e.currentTarget.value = ''
        setNewTag('')
      }
    }
  }

  const removeTag = (tagToRemove: string) => {
    setValue(
      'tags',
      tags.filter((t) => t !== tagToRemove)
    )
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCoverFile(file)

    // Chỉ preview local
    const reader = new FileReader()
    reader.onloadend = () => setPreviewImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const addPost = async (data: FormData) => {
    if (!user) {
      toast.error('Bạn chưa đăng nhập!')
      navigate('/login')
      return
    }

    setUploadProgress(0)

    try {
      let imageUrl = null

      // Upload ảnh thật chỉ khi submit
      if (coverFile) {
        setUploadProgress(10) // Bắt đầu progress
        const formData = new FormData()
        formData.append('file', coverFile)
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData
        })

        // Giả lập progress (tăng dần đến 90%)
        const interval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 15, 90))
        }, 400)

        const result = await response.json()
        clearInterval(interval)
        setUploadProgress(100)

        if (result.secure_url) {
          imageUrl = result.secure_url
        } else {
          throw new Error('Upload ảnh thất bại')
        }
      }

      const slug = slugify(data.title, { lower: true, strict: true })

      const postData: Omit<Post, 'id'> = {
        title: data.title,
        titleLower: data.title.toLowerCase().trim(),
        slug,
        content: data.content,
        image: imageUrl,
        tags: data.tags || [],
        category: 'Chưa phân loại',
        authorId: user.uid,
        authorName: user.displayName || 'Gamer',
        status: DEFAULT_POST_STATUS,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        likesCount: 0,
        viewsCount: 0,
        commentsCount: 0,
        isFeatured: false,
        authorPhotoURL: user.photoURL ?? undefined
      }
      const colRef = collection(db, POSTS_COLLECTION)
      await addDoc(colRef, postData)
      toast.success('Bài viết đã được gửi thành công!', {
        description: 'Bài viết đang chờ admin duyệt. Bạn sẽ nhận thông báo khi được duyệt hoặc chỉnh sửa.',
        duration: 6000, // Hiện lâu hơn để đọc
        action: {
          label: 'Xem trạng thái',
          onClick: () => navigate('/my-posts') // Sau này link đến trang bài của tôi
        }
      })
      navigate('/')
    } catch (error) {
      console.error('Lỗi:', error)
      toast.error('Có lỗi xảy ra!')
    } finally {
      setUploadProgress(0)
    }
  }

  return (
    <div className='min-h-screen py-12 bg-background'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        <Card className='border-none shadow-lg'>
          <CardHeader className='text-center pb-2'>
            <CardTitle className='text-3xl font-bold'>Viết bài mới</CardTitle>
            <CardDescription>Chia sẻ kinh nghiệm game của bạn với cộng đồng</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(addPost)} className='space-y-8'>
              {/* Tiêu đề */}
              <div className='space-y-2'>
                <Label htmlFor='title' className='text-lg font-medium'>
                  Tiêu đề bài viết *
                </Label>
                <Input
                  id='title'
                  {...register('title')}
                  placeholder="Ví dụ: Mẹo leo rank nhanh với Kha'Zix mùa 15"
                  autoFocus
                  className={cn(formInputClass, errors.title && 'border-destructive focus-visible:ring-destructive/50')}
                  disabled={isSubmitting}
                  lang='vi'
                  spellCheck={false} // ← tắt gạch chân đỏ
                  autoCorrect='off'
                  autoCapitalize='off'
                />
                {errors.title && <p className='text-red-500 text-sm'>{errors.title.message}</p>}
              </div>

              {/* Ảnh bìa */}
              <div className='space-y-2'>
                <Label className='text-lg font-medium'>Ảnh bìa (tùy chọn)</Label>
                <label className='flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer hover:bg-accent/50 transition relative'>
                  <input
                    type='file'
                    accept='image/*'
                    className='hidden'
                    onChange={handleImageChange}
                    disabled={isSubmitting}
                  />

                  {previewImage ? (
                    <img src={previewImage} alt='Preview' className='w-full h-full object-cover rounded-xl' />
                  ) : (
                    <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                      <Upload className='w-10 h-10 text-muted-foreground mb-3' />
                      <p className='text-sm text-muted-foreground'>Kéo thả hoặc click để chọn ảnh</p>
                    </div>
                  )}
                </label>
              </div>

              {/* Progress khi submit */}
              {isSubmitting && (
                <div className='mt-6 space-y-2'>
                  <p className='text-sm text-muted-foreground'>Đang đăng bài...</p>
                  <Progress value={uploadProgress} className='h-2' />
                </div>
              )}

              {/* Nội dung */}
              <div className='space-y-2'>
                <Label htmlFor='content' className='text-lg font-medium'>
                  Nội dung bài viết *
                </Label>
                <div
                  lang='en'
                  className={cn(
                    'w-full rounded-md border bg-background/80 text-foreground',
                    'transition-all duration-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary/50 focus-within:bg-background',
                    'dark:bg-background/50 dark:border-primary/20',
                    'dark:focus-within:ring-primary/70 dark:focus-within:shadow-lg dark:focus-within:shadow-primary/30 quill-shared',
                    // viền đỏ khi error
                    errors.content && 'border-destructive focus-within:ring-destructive/50',

                    'overflow-hidden'
                  )}
                >
                  <ReactQuill
                    ref={quillRef}
                    theme='snow'
                    value={watch('content') || ''} // lấy từ form thay vì state riêng
                    onChange={(html) => setValue('content', html, { shouldValidate: true })}
                    modules={modules}
                    formats={formats}
                    placeholder='Viết nội dung bài của bạn ở đây...'
                    className='min-h-[400px] text-base quill-shared entry-content'
                  />
                </div>

                {errors.content && <p className='text-red-500 text-sm'>{errors.content.message}</p>}
              </div>

              {/* Tags */}
              <div className='space-y-2'>
                <Label className='text-lg font-medium'>Tags (nhấn Enter hoặc phẩy để thêm - không bắt buộc)</Label>
                <div className='flex flex-wrap gap-2 mb-3'>
                  {tags.map((tag) => (
                    <Badge key={tag} variant='secondary' className='flex items-center gap-1 px-3 py-1'>
                      {tag}
                      <button
                        type='button'
                        onClick={() => removeTag(tag)}
                        className='ml-1 text-muted-foreground hover:text-foreground'
                      >
                        <X className='h-3 w-3' />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className='flex gap-2'>
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={addTag}
                    placeholder="Thêm tag (ví dụ: Kha'Zix, Guide)"
                    className={cn(formInputClass, 'max-w-xs text-base!')}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Nút submit */}
              <div className='flex justify-end gap-4 pt-6 border-t'>
                <Button type='button' variant='destructive' onClick={() => navigate(-1)} disabled={isSubmitting}>
                  Hủy
                </Button>
                <Button type='submit' disabled={isSubmitting}>
                  {isSubmitting ? 'Đang đăng...' : 'Đăng bài'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default WritePage
