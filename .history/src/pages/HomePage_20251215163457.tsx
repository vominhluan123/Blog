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
          <Card className='sticky top-24 rounded-xl border bg-card shadow-sm'>
            <CardContent className='p-6'>
              {/* Thông tin cá nhân */}
              <div className='flex items-center gap-4 mb-8'>
                <Avatar className='h-16 w-16 ring-4 ring-primary/20'>
                  <AvatarImage src='https://github.com/shadcn.png' alt='Luân - Author' />
                  <AvatarFallback className='text-xl font-bold bg-primary/10 text-primary'>LN</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className='text-lg font-bold text-foreground'>Luân</h3>
                  <p className='text-sm text-muted-foreground'>Frontend Dev & Gamer</p>
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className='text-h3 font-bold text-foreground mb-4'>Danh mục</h3>
                <nav className='space-y-2'>
                  <Link
                    to='/categories/game'
                    className='block px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200'
                  >
                    Game Guides
                  </Link>
                  <Link
                    to='/categories/esports'
                    className='block px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200'
                  >
                    Esports
                  </Link>
                  <Link
                    to='/categories/review'
                    className='block px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200'
                  >
                    Review Game
                  </Link>
                  <Link
                    to='/categories/tips'
                    className='block px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200'
                  >
                    Tips & Tricks
                  </Link>
                </nav>
              </div>
            </CardContent>
          </Card>
        </aside>
        {/* Main feed */}
        <section className='lg:col-span-6'>
          <h1 className='text-h1 font-extrabold mb-10 text-primary'>Blog Game - Tips, Review & Hướng dẫn</h1>

          {/* Hero */}
          <div className='mb-10 rounded-2xl bg-primary p-8 text-primary-foreground'>
            <h2 className='text-h2 font-extrabold leading-tight'>Bài viết nổi bật</h2>
            <p className='mt-4 text-primary-foreground/90 text-body max-w-2xl'>
              Cập nhật mới nhất từ cộng đồng — tips, review, và phân tích meta.
            </p>
            <Button variant='secondary' size='lg' className='mt-6'>
              Đọc ngay
            </Button>
          </div>

          {/* Bài viết */}
          <div className='space-y-6'>
            {samplePosts.map((post) => (
              <article
                key={post.id}
                className='rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow'
              >
                <div className='flex gap-4'>
                  <Avatar className='h-12 w-12'>
                    <AvatarImage src='https://github.com/shadcn.png' />
                    <AvatarFallback>LN</AvatarFallback>
                  </Avatar>
                  <div className='flex-1'>
                    <h2 className='text-h3 font-bold text-foreground hover:text-primary transition-colors'>
                      <Link to={`/post/${post.id}`}>{post.title}</Link>
                    </h2>
                    <p className='text-body text-muted-foreground mt-2'>{post.excerpt}</p>
                    <div className='mt-4 flex items-center justify-between text-sm text-muted-foreground'>
                      <div>
                        {post.author} • {post.date}
                      </div>
                      <div className='flex gap-4'>
                        <button className='hover:text-primary'>Like</button>
                        <button className='hover:text-primary'>Comment</button>
                        <button className='hover:text-primary'>Share</button>
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
              <div className='mt-3 space-y-2 text-sm text-slate-700 flex flex-col'>
                <Link to=''>Top 10 build Jungler mùa 15</Link>
                <Link to=''>Hướng dẫn map control</Link>
                <Link to=''>Tin meta mới</Link>
              </div>
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
