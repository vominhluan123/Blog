import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/useAuth'
import { cn } from '@/lib/utils' // ← shadcn helper classnames
import { Gamepad2, Lightbulb, Star, Trophy } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { categoryMapping } from '@/lib/categoryMapping'
const categories = [
  {
    slug: 'game',
    to: '/categories/game',
    label: 'Hướng dẫn chơi game',
    icon: Gamepad2
  },
  {
    id: 'esports',
    to: '/categories/esports',
    label: 'Esports',
    icon: Trophy
  },
  {
    id: 'review',
    to: '/categories/review',
    label: 'Review game',
    icon: Star
  },
  {
    id: 'tips',
    to: '/categories/tips',
    label: 'Mẹo & Thủ thuật',
    icon: Lightbulb
  }
]

const LeftSidebar = () => {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Lấy category hiện tại từ URL (ví dụ: /categories/game → "game")
 const currentSlug = location.pathname.split('/').pop() || ''

  return (
    <aside className='hidden lg:block lg:col-span-3'>
      <Card className='sticky top-24 rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm'>
        <CardContent className='p-6'>
          {/* Phần thông tin người dùng */}
          <div className='flex items-center gap-4 mb-8'>
            {loading ? (
              <Skeleton className='h-16 w-16 rounded-full' />
            ) : (
              <Avatar className='h-16 w-16 ring-4 ring-primary/20'>
                <AvatarImage
                  src={user?.photoURL || 'https://github.com/shadcn.png'}
                  alt={user?.displayName || 'User'}
                />
                <AvatarFallback className='text-xl font-bold bg-primary/10 text-primary'>
                  {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            )}

            <div>
              <h3 className='text-lg font-bold leading-tight tracking-tight'>{user?.displayName || 'Luân'}</h3>
              <p className='text-sm text-muted-foreground'>{user ? 'Thành viên cộng đồng' : 'Frontend Dev & Gamer'}</p>
            </div>
          </div>

          {/* Danh mục */}
          <div>
            <h3 className='text-lg font-bold tracking-tight mb-4'>Danh mục</h3>

            <nav className='space-y-1.5'>
              {categories.map((cat) => {
                const isActive = const currentSlug = location.pathname.split('/').pop() || '' === cat.id

                return (
                  <Link
                    key={cat.id}
                    to={cat.to}
                    className={cn(
                      'group flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <cat.icon
                      className={cn(
                        'h-5 w-5 transition-colors',
                        isActive
                          ? 'text-primary-foreground'
                          : 'text-muted-foreground group-hover:text-accent-foreground'
                      )}
                    />
                    <span>{cat.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}

export default LeftSidebar
