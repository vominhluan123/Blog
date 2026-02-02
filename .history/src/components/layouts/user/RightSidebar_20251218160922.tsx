import { Link } from 'react-router'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Card, CardContent } from '../ui/card'

const RightSidebar = () => {
  return (
    <aside className='hidden xl:block xl:col-span-3'>
      <div className='sticky top-24 space-y-6'>
        {/* Bài viết tuần */}
        <Card className='rounded-xl border bg-card shadow-sm'>
          <CardContent className='p-6'>
            <h3 className='text-h3 font-bold text-foreground mb-5'>Bài viết hot tuần</h3>
            <ol className='space-y-4'>
              <li>
                <Link to='/post/1' className='block text-foreground hover:text-primary transition-colors font-medium'>
                  Top 10 build Jungler mùa 15
                </Link>
                <p className='text-sm text-muted-foreground mt-1'>2.5k lượt xem</p>
              </li>
              <li>
                <Link to='/post/2' className='block text-foreground hover:text-primary transition-colors font-medium'>
                  Hướng dẫn map control toàn diện
                </Link>
                <p className='text-sm text-muted-foreground mt-1'>1.8k lượt xem</p>
              </li>
              <li>
                <Link to='/post/3' className='block text-foreground hover:text-primary transition-colors font-medium'>
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
  )
}

export default RightSidebar
