import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/contexts/useAuth'
import { DEFAULT_POST_STATUS, POSTS_COLLECTION, type Post, PostStatus } from '@/firebase/db'
import { db } from '@/firebase/firebase-config'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { doc, getDoc, addDoc, updateDoc, collection, Timestamp } from 'firebase/firestore'
import { Upload, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { useNavigate, useSearchParams } from 'react-router'
import slugify from 'slugify'
import { toast } from 'sonner'
import * as z from 'zod'

// Schema Zod (giữ nguyên)
const schema = z
  .object({
    title: z.string().min(5, 'Tiêu đề phải ít nhất 5 ký tự').max(200, 'Tiêu đề tối đa 200 ký tự'),
    content: z.string().min(1, 'Nội dung không được để trống').max(10000, 'Nội dung quá dài (tối đa 10.000 ký tự)'),
    tags: z.array(z.string().min(2)).optional()
  })
  .superRefine((data, ctx) => {
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
        path: ['content']
      })
    }
  })

type FormData = z.infer<typeof schema>

const CLOUDINARY_CLOUD_NAME = 'dhxhcwdo5'
const CLOUDINARY_UPLOAD_PRESET = 'blog_upload_img'

const WritePage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const editPostId = searchParams.get('edit')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tags: [] },
    mode: 'onChange'
  })

  const tags = watch('tags') || []
  const [newTag, setNewTag] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null) // file mới để upload
  const [uploadProgress, setUploadProgress] = useState(0)
  const quillRef = useRef<ReactQuill>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [originalPost, setOriginalPost] = useState<Post | null>(null)
  const [loadingPost, setLoadingPost] = useState(!!editPostId)

  const formInputClass = cn(
    '!w-full rounded-md border !text-xl py-6',
    'bg-background/80 text-foreground placeholder-muted-foreground/70',
    'transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-background backdrop-blur-sm',
    'dark:bg-background/50 dark:border-primary/20',
    'dark:focus:ring-primary/70 dark:focus:shadow-lg dark:focus:shadow-primary/30'
  )

  // Tắt spellcheck cho Quill
  useEffect(() => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor()
      const editorElement = editor.root
      if (editorElement) {
        editorElement.setAttribute('spellcheck', 'false')
        editorElement.setAttribute('autocorrect', 'off')
        editorElement.setAttribute('autocapitalize', 'off')
        editorElement.setAttribute('lang', 'vi')
      }
    }
  }, [])

  // Fetch bài viết nếu có ?edit=...
  useEffect(() => {
    if (!editPostId || !user) return

    const fetchPost = async () => {
      setLoadingPost(true)
      try {
        const postRef = doc(db, POSTS_COLLECTION, editPostId)
        const postSnap = await getDoc(postRef)

        if (!postSnap.exists()) {
          toast.error('Bài viết không tồn tại hoặc đã bị xóa')
          navigate('/my-posts')
          return
        }

        const postData = { id: postSnap.id, ...postSnap.data() } as Post

        // Kiểm tra quyền & trạng thái
        if (postData.authorId !== user.uid) {
          toast.error('Bạn không có quyền chỉnh sửa bài viết này')
          navigate('/my-posts')
          return
        }

        if (![PostStatus.PENDING, PostStatus.REJECTED].includes(postData.status)) {
          toast.error('Bài viết này không thể chỉnh sửa nữa')
          navigate('/my-posts')
          return
        }

        // Điền dữ liệu cũ
        setValue('title', postData.title || '')
        setValue('content', postData.content || '')
        setValue('tags', postData.tags || [])
        setPreviewImage(postData.image || null) // ảnh cũ từ Cloudinary

        setOriginalPost(postData)
        setIsEditMode(true)
        toast.info('Đang chỉnh sửa bài viết cũ. Sau khi sửa xong, nhấn "Gửi lại để duyệt".')
      } catch (err) {
        console.error('Lỗi tải bài viết:', err)
        toast.error('Không thể tải bài viết để chỉnh sửa')
        navigate('/my-posts')
      } finally {
        setLoadingPost(false)
      }
    }

    fetchPost()
  }, [editPostId, user, navigate, setValue])

  // Upload ảnh trong Quill toolbar
  const handleImageUpload = () => {
    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', 'image/*')
    input.click()

    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      try {
        toast.loading('Đang upload ảnh vào nội dung...')
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData
        })

        const data = await response.json()
        if (data.secure_url) {
          const quill = quillRef.current?.getEditor()
          if (quill) {
            const range = quill.getSelection(true)
            quill.insertEmbed(range.index, 'image', data.secure_url)
            quill.setSelection(range.index + 1)
          }
          toast.success('Ảnh đã chèn thành công!')
        } else {
          throw new Error('Upload failed')
        }
      } catch (err) {
        console.error(err)
        toast.error('Upload ảnh thất bại')
      } finally {
        toast.dismiss()
      }
    }
  }

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline'],
          ['link', 'image'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['clean']
        ],
        handlers: { image: handleImageUpload }
      }
    }),
    []
  )

  const formats = ['header', 'bold', 'italic', 'underline', 'link', 'list', 'image']

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
    const reader = new FileReader()
    reader.onloadend = () => setPreviewImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast.error('Bạn chưa đăng nhập!')
      navigate('/login')
      return
    }

    setUploadProgress(0)

    try {
      let imageUrl = originalPost?.image || null // giữ ảnh cũ nếu không thay

      // Upload ảnh bìa mới nếu có
      if (coverFile) {
        setUploadProgress(10)
        const formData = new FormData()
        formData.append('file', coverFile)
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData
        })

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

      const postData = {
        title: data.title.trim(),
        titleLower: data.title.toLowerCase().trim(),
        slug,
        content: data.content,
        image: imageUrl,
        tags: data.tags?.filter(Boolean) || [],
        category: originalPost?.category || 'Chưa phân loại',
        authorId: user.uid,
        authorName: user.displayName || 'Gamer',
        authorPhotoURL: user.photoURL ?? undefined,
        updatedAt: Timestamp.now()
      }

      if (isEditMode && originalPost) {
        // MODE EDIT: update + reset status
        await updateDoc(doc(db, POSTS_COLLECTION, originalPost.id), {
          ...postData,
          status: PostStatus.PENDING,
          rejectReason: null // xóa lý do cũ
        })

        toast.success('Đã cập nhật và gửi lại bài viết để duyệt!', {
          description: 'Admin sẽ xem xét lại sớm nhất có thể.',
          action: { label: 'Xem trạng thái', onClick: () => navigate('/my-posts') }
        })
        navigate('/my-posts')
      } else {
        // MODE CREATE mới
        const fullPostData = {
          ...postData,
          status: DEFAULT_POST_STATUS,
          createdAt: Timestamp.now(),
          likesCount: 0,
          viewsCount: 0,
          commentsCount: 0,
          isFeatured: false
        }
        await addDoc(collection(db, POSTS_COLLECTION), fullPostData)

        toast.success('Bài viết đã được gửi thành công!', {
          description: 'Bài viết đang chờ admin duyệt.',
          duration: 6000,
          action: { label: 'Xem trạng thái', onClick: () => navigate('/my-posts') }
        })
        navigate('/')
      }
    } catch (error) {
      console.error('Lỗi submit:', error)
      toast.error('Có lỗi xảy ra khi gửi bài viết!')
    } finally {
      setUploadProgress(0)
    }
  }

  if (loadingPost) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p className='text-lg'>Đang tải bài viết để chỉnh sửa...</p>
      </div>
    )
  }

  return (
    <div className='min-h-screen py-12 bg-background'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        <Card className='border-none shadow-lg'>
          <CardHeader className='text-center pb-2'>
            <CardTitle className='text-3xl font-bold'>
              {isEditMode ? 'Chỉnh sửa & Gửi lại bài viết' : 'Viết bài mới'}
            </CardTitle>
            <CardDescription>
              {isEditMode ? 'Sửa nội dung và gửi lại để admin duyệt' : 'Chia sẻ kinh nghiệm game của bạn với cộng đồng'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-8'>
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
                  spellCheck={false}
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

              {isSubmitting && uploadProgress > 0 && (
                <div className='mt-6 space-y-2'>
                  <p className='text-sm text-muted-foreground'>Đang xử lý...</p>
                  <Progress value={uploadProgress} className='h-2' />
                </div>
              )}

              {/* Nội dung Quill */}
              <div className='space-y-2'>
                <Label htmlFor='content' className='text-lg font-medium'>
                  Nội dung bài viết *
                </Label>
                <div
                  className={cn(
                    'w-full rounded-md border bg-background/80 text-foreground',
                    'transition-all duration-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary/50 focus-within:bg-background',
                    'dark:bg-background/50 dark:border-primary/20',
                    'dark:focus-within:ring-primary/70 dark:focus-within:shadow-lg dark:focus-within:shadow-primary/30 quill-shared',
                    errors.content && 'border-destructive focus-within:ring-destructive/50'
                  )}
                >
                  <ReactQuill
                    ref={quillRef}
                    theme='snow'
                    value={watch('content') || ''}
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
                <Label className='text-lg font-medium'>Tags (Enter hoặc phẩy để thêm)</Label>
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
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={addTag}
                  placeholder="Thêm tag (ví dụ: Kha'Zix, Guide)"
                  className={cn(formInputClass, 'max-w-xs text-base!')}
                  disabled={isSubmitting}
                />
              </div>

              {/* Nút */}
              <div className='flex justify-end gap-4 pt-6 border-t'>
                <Button type='button' variant='outline' onClick={() => navigate(-1)} disabled={isSubmitting}>
                  Hủy
                </Button>
                <Button type='submit' disabled={isSubmitting}>
                  {isSubmitting ? 'Đang xử lý...' : isEditMode ? 'Gửi lại để duyệt' : 'Đăng bài'}
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
