import { useAuth } from '@/contexts/useAuth'
import { Gamepad2, Lightbulb, Star, Trophy } from 'lucide-react'
import { Link } from 'react-router'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Card, CardContent } from '../ui/card'

const LeftSidebar = () => {
  const { user, } = useAuth()
  const categories = [
    { to: '/categories/game', label: 'Hướng dẫn chơi game', icon: Gamepad2 },
    { to: '/categories/esports', label: 'Esports', icon: Trophy },
    { to: '/categories/review', label: 'Review game', icon: Star },
    { to: '/categories/tips', label: 'Mẹo & Thủ thuật', icon: Lightbulb }
  ]
  return (
    <aside className='hidden lg:block lg:col-span-3'>
      <Card className='sticky top-24 rounded-xl border bg-card shadow-sm'>
        <CardContent className='p-6'>
          {/* Thông tin cá nhân */}
          <div className='flex items-center gap-4 mb-8'>
            <Avatar className='h-16 w-16 ring-4 ring-primary/20'>
              <AvatarImage src={user?.photoURL || 'https://github.com/shadcn.png'} alt={user?.displayName || 'Luân'} />
              <AvatarFallback className='text-xl font-bold bg-primary/10 text-primary'>
                {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'L'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className='text-lg font-bold text-foreground'>{user?.displayName || 'Luân'}</h3>
              <p className='text-sm text-muted-foreground'>{user ? 'Thành viên cộng đồng' : 'Frontend Dev & Gamer'}</p>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className='text-h3 font-bold text-foreground mb-4'>Danh mục</h3>
            <nav className='space-y-2'>
              {categories.map((categorie) => (
                <Link
                  key={categorie.to}
                  to={categorie.to}
                  className='flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200'
                >
                  <categorie.icon className='h-5 w-5' />
                  <span>{categorie.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}

export default LeftSidebar
