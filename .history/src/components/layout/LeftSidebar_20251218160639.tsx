import React from 'react'
import { Card, CardContent } from '../ui/card'
import { Avatar, AvatarImage } from '../ui/avatar'

const LeftSidebar = () => {
  return (
    <aside className='hidden lg:block lg:col-span-3'>
      <Card className='sticky top-24 rounded-xl border bg-card shadow-sm'>
        <CardContent className='p-6'>
          {/* Thông tin cá nhân */}
          <div className='flex items-center gap-4 mb-8'>
            <Avatar className='h-16 w-16 ring-4 ring-primary/20'>
              <AvatarImage src='https://github.com/shadcn.png' alt='Luân - Author' />
              <AvatarFallback className='text-xl font-bold bg-primary/10 text-primary'>L</AvatarFallback>
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
  )
}

export default LeftSidebar