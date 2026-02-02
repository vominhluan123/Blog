import { ModeToggle } from '@/components/theme/mode-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/useAuth'
import { POSTS_COLLECTION, PostStatus } from '@/firebase/db'
import { auth, db } from '@/firebase/firebase-config'
import { cn } from '@/lib/utils'
import { signOut } from 'firebase/auth'
import { collection, endAt, getDocs, limit, orderBy, query, startAt, where } from 'firebase/firestore'
import { Gamepad2, Home, LogOut, Menu, PenTool, Settings, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router'
const Header = () => {
  const { user, loading } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  // ── Search ──
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ id: string; title: string }>>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Click ra ngoài thì ẩn kết quả tìm kiếm
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchResults([])
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Tìm kiếm
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([])
      return
    }
    const timeoutId = setTimeout(async () => {
      setIsSearching(true)
      try {
        const searchTerm = searchQuery.trim().toLowerCase()
        const q = query(
          collection(db, POSTS_COLLECTION),
          where('status', '==', PostStatus.APPROVED),
          orderBy('titleLower', 'asc'), // ← cần tạo field titleLower khi save post
          startAt(searchTerm),
          endAt(searchTerm + '\uf8ff'),
          limit(8)
        )

        const snapshot = await getDocs(q)
        const results = snapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title as string
        }))
        setSearchResults(results)
      } catch (err) {
        console.error('Lỗi tìm kiếm:', err)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 350) // debounce 350ms

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20) // Scroll quá 20px thì kích hoạt
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const searchInputClass = cn(
    'hidden md:block px-4 py-2 rounded-full border',
    'bg-background/80 text-foreground placeholder-muted-foreground/70',
    'transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-background w-64 backdrop-blur-sm',
    'dark:bg-background/50 dark:border-primary/20',
    'dark:focus:ring-primary/70 dark:focus:shadow-lg dark:focus:shadow-primary/30'
  )
  const desktopNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `transition-all duration-200 px-4 py-2 font-medium ${
      isActive ? 'text-primary underline underline-offset-4' : 'text-foreground hover:text-primary'
    }`
  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block w-full text-left px-4 py-3 rounded-lg text-lg md:text-sm font-medium transition-colors ${
      isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent hover:text-accent-foreground'
    }`
  const menuLink = [
    {
      url: '/',
      title: 'Trang chủ'
    },
    {
      url: '/contact',
      title: 'Liên hệ'
    }
  ]
  const handleLogout = async () => {
    await signOut(auth)
  }
  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? 'bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80 shadow-lg'
          : 'bg-card/90 backdrop-blur supports-backdrop-filter:bg-card/70 shadow'
      }`}
    >
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16'>
        <div className='flex items-center md:gap-8'>
          <Link to='/' className=''>
            <Gamepad2
              className={`transition-all duration-300 text-primary ${
                scrolled ? 'h-9 w-9 hidden md:block' : 'h-11 w-11 hidden md:block'
              }`}
            />
          </Link>
          <nav className='hidden md:flex items-center gap-4 text-sm'>
            {menuLink.map((item) => (
              <NavLink key={item.title} to={item.url} className={desktopNavLinkClass}>
                {item.title}
              </NavLink>
            ))}
          </nav>
          {/* Hamburger menu cho mobile */}
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant='ghost' className='md:hidden flex items-center gap-2 px-3'>
                <Menu className='h-6 w-6' />
                <span className='text-sm font-medium'>Menu</span>
                <span className='sr-only'>Menu</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle className='text-left'>MyGameBlog</DrawerTitle>
              </DrawerHeader>
              <nav className='px-4 py-6 space-y-4'>
                {menuLink.map((item) => (
                  <NavLink key={item.title} to={item.url} className={mobileNavLinkClass}>
                    {item.title}
                  </NavLink>
                ))}
              </nav>
            </DrawerContent>
          </Drawer>
        </div>

        <div className='flex items-center gap-4 relative' ref={s}>
          <Input placeholder='Tìm bài viết...' className={searchInputClass} />
          <ModeToggle />
          {loading ? (
            <Skeleton className='h-10 w-10 rounded-full' />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  className='relative h-10 w-10 rounded-full ring-2 ring-primary/20 hover:ring-primary/40'
                >
                  <Avatar className='h-10 w-10'>
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                    <AvatarFallback className='bg-primary/20 text-primary font-bold'>
                      {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'G'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className='w-56 mr-4' align='end'>
                <DropdownMenuLabel className='font-normal'>
                  <div className='flex flex-col space-y-1'>
                    <p className='text-sm font-medium leading-none'>{user.displayName || 'Gamer'}</p>
                    <p className='text-xs text-muted-foreground'>{user.email}</p>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link to='/profile' className='flex items-center cursor-pointer'>
                    <User className='mr-2 h-4 w-4' />
                    <span>Cập nhật hồ sơ</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link to='/my-posts' className='flex items-center cursor-pointer'>
                    <Home className='mr-2 h-4 w-4' />
                    <span>Bài viết của tôi</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link to='/write' className='flex items-center cursor-pointer'>
                    <PenTool className='mr-2 h-4 w-4' />
                    <span>Viết bài mới</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link to='/settings' className='flex items-center cursor-pointer'>
                    <Settings className='mr-2 h-4 w-4' />
                    <span>Cài đặt</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className='text-destructive focus:text-destructive cursor-pointer'
                >
                  <LogOut className='mr-2 h-4 w-4' />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link to='/login'>Đăng nhập</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
