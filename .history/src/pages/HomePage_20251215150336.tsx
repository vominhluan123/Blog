import { Card } from '@/components/ui/card'
import { useTitle } from '@/hooks/useTitle'
type Post = {
  id: number
  title: string
  excerpt: string
  author: string
  date: string
  tags: string[]
  image?: string
}

const samplePosts: Post[] = Array.from({ length: 6 }).map((_, i) => ({
  id: i + 1,
  title: `Mẹo chơi Kha'Zix - bài ${i + 1}`,
  excerpt: 'Tóm tắt ngắn gọn: Hướng dẫn vị trí, build, và tips để outplay đối thủ ở giai đoạn giữa trận.',
  author: `Tác giả ${i + 1}`,
  date: 'Dec 12, 2025',
  tags: ['Game', "Kha'Zix", 'Guide'],
  image: undefined
}))
const HomePage = () => {
  useTitle('Trang chủ')

  return (
    <>
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
        {/* Left sidebar */}
        <aside className='hidden lg:block lg:col-span-3'>
          <Card className='sticky top-20'>
            <CardContent>
              <div className='flex items-center gap-3'>
                <Avatar />
                <div>
                  <div className='font-semibold'>Luân</div>
                  <div className='text-sm text-slate-500'>Frontend dev & gamer</div>
                </div>
              </div>

              <div className='mt-4'>
                <h3 className='text-sm font-semibold'>Categories</h3>
                <ul className='mt-2 space-y-2 text-sm text-slate-600'>
                  <li className='hover:text-slate-900'>Game</li>
                  <li className='hover:text-slate-900'>Esports</li>
                  <li className='hover:text-slate-900'>Review</li>
                  <li className='hover:text-slate-900'>Tips</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  )
}

export default HomePage
