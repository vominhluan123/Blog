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
          <div className='sticky top-24 space-y-6'>
            {/* Bài viết tuần */}
            <Card className='rounded-xl border bg-card shadow-sm'>
              <CardContent className='p-6'>
                <h3 className='text-h3 font-bold text-foreground mb-5'>Bài viết hot tuần</h3>
                <ol className='space-y-4'>
                  <li>
                    <Link
                      to='/post/1'
                      className='block text-foreground hover:text-primary transition-colors font-medium'
                    >
                      Top 10 build Jungler mùa 15
                    </Link>
                    <p className='text-sm text-muted-foreground mt-1'>2.5k lượt xem</p>
                  </li>
                  <li>
                    <Link
                      to='/post/2'
                      className='block text-foreground hover:text-primary transition-colors font-medium'
                    >
                      Hướng dẫn map control toàn diện
                    </Link>
                    <p className='text-sm text-muted-foreground mt-1'>1.8k lượt xem</p>
                  </li>
                  <li>
                    <Link
                      to='/post/3'
                      className='block text-foreground hover:text-primary transition-colors font-medium'
                    >
                      Tin meta mới nhất từ Riot
                    </Link>
                    <p className='text-sm text-muted-foreground mt-1'>1.4k lượt xem</p>
                  </li>
                </ol>
              </CardContent>
            </Card>

            {/* Tác giả nổi bật */}
            <Card className='rounded-xl border bg-card shadow-sm'>
              <CardContent className='p-6'>
                <h3 className='text-h3 font-bold text-foreground mb-5'>Tác giả nổi bật</h3>
                <div className='space-y-4'>
                  <div className='flex items-center gap-4'>
                    <Avatar className='h-12 w-12'>
                      <AvatarImage src='https://github.com/shadcn.png' alt='Author Name' />
                      <AvatarFallback>AN</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className='font-semibold text-foreground'>Vũ "ProGamer" Nguyễn</p>
                      <p className='text-sm text-muted-foreground'>Master Jungler • 50 bài viết</p>
                    </div>
                  </div>

                  <div className='flex items-center gap-4'>
                    <Avatar className='h-12 w-12'>
                      <AvatarImage src='https://github.com/shadcn.png' alt='Another Author' />
                      <AvatarFallback>TA</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className='font-semibold text-foreground'>Minh Esports</p>
                      <p className='text-sm text-muted-foreground'>Phân tích giải đấu • 32 bài</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>
    </>
  )
}

export default HomePage
