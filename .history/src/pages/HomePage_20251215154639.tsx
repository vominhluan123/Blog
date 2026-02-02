import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useTitle } from '@/hooks/useTitle'
import { Link } from 'react-router'
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
                <Avatar>
                  {' '}
                  <AvatarImage src='https://github.com/shadcn.png' />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div>
                  <div className='font-semibold'>Luân</div>
                  <div className='text-sm text-slate-500'>Frontend dev & gamer</div>
                </div>
              </div>
              <div className='mt-4'>
                <h3 className=' font-semibold text-h3'>Categories</h3>
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
        {/* Main feed */}
        <section className='lg:col-span-6'>
          <h1 className='text-h1 font-extrabold mb-8'>Blog Game - Tips, Review & Hướng dẫn</h1>
          {/* Small hero */}
          <div className='mb-6'>
            <div className='rounded-xl overflow-hidden bg-blue-600 text-white p-6'>
              <div className='max-w-3xl'>
                <h3 className='text-h2 font-extrabold leading-tight'>Bài viết nổi bật</h3>
                <p className='mt-2 text-slate-100/90 text-body'>
                  Cập nhật mới nhất từ cộng đồng — tips, review, và phân tích meta.
                </p>
                <div className='mt-4'>
                  <Button variant='secondary'>Đọc ngay</Button>
                </div>
              </div>
            </div>
          </div>
          {/* Feed list */}
          <div className='space-y-4'>
            {samplePosts.map((post) => (
              <article
                key={post.id}
                className='bg-white rounded-xl p-4 shadow-sm border border-slate-100'
                aria-labelledby={`post-${post.id}-title`}
              >
                <div className='flex gap-3'>
                  <Avatar>
                    {' '}
                    <AvatarImage src='https://github.com/shadcn.png' />
                    <AvatarFallback>LN</AvatarFallback>
                  </Avatar>
                  <div className='flex-1'>
                    <h2 id={`post-${post.id}-title`} className='text-h3 font-semibold'>
                      <Link to={`/post/${post.id}`}>{post.title}</Link>
                    </h2>
                    <p className='text-body text-slate-600 mt-1'>{post.excerpt}</p>

                    <div className='mt-3 flex items-center justify-between text-body text-slate-500'>
                      <div>
                        <span>{post.author}</span>
                        <span className='mx-2'>•</span>
                        <time dateTime='2025-12-12'>{post.date}</time>
                      </div>
                      <div className='flex items-center gap-2'>
                        <button className='text-sm hover:text-slate-900'>Like</button>
                        <button className='text-sm hover:text-slate-900'>Comment</button>
                        <button className='text-sm hover:text-slate-900'>Share</button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
        {/* Right sidebar */}
        <aside className='hidden xl:block xl:col-span-3'>
          <Card className='sticky top-20'>
            <CardContent>
              <h3 className='font-semibold text-h4'>Bài viết tuần</h3>
              <ul className='mt-3 space-y-2 text-sm text-slate-700'>
                <Link >Top 10 build Jungler mùa 15</Link >
                <Link >Hướng dẫn map control</Link >
                <Link >Tin meta mới</Link >
              </ul>
              <div className='mt-4'>
                <h3 className='font-semibold text-4'>Tác giả nổi bật</h3>
                <div className='mt-2 flex items-center gap-3'>
                  <Avatar>
                    <Avatar>
                      {' '}
                      <AvatarImage src='https://github.com/shadcn.png' />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                  </Avatar>
                  <div>
                    <div className='text-sm font-medium'>Author Name</div>
                    <div className='text-xs text-slate-500'>Top contributor</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  )
}

export default HomePage
