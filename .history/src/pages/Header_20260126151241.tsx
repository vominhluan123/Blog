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
import { auth } from '@/firebase/firebase-config'
import { cn } from '@/lib/utils'
import { signOut } from 'firebase/auth'
import { Gamepad2, Home, LogOut, Menu, PenTool, Settings, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router'
const Header = () => {
  const { user, loading } = useAuth()
  const [scrolled, setScrolled] = useState(false)

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

        <div className='flex items-center gap-4'>
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
 cái chỗ tìm kiếm mình mún tìm những bài viết đây là mainFeed của mình: import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { POSTS_COLLECTION, PostStatus, type Post } from '@/firebase/db' // Import interface Post của bạn
import { db } from '@/firebase/firebase-config'
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Badge } from '../../ui/badge'
import { Skeleton } from '../../ui/skeleton'

const MainFeed = () => {
  const [featuredPost, setFeaturedPost] = useState<Post | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Lấy bài nổi bật (ưu tiên 1 bài isFeatured = true)
        const featuredQuery = query(
          collection(db, POSTS_COLLECTION),
          where('status', '==', PostStatus.APPROVED),
          where('isFeatured', '==', true),
          orderBy('createdAt', 'desc'),
          limit(1)
        )
        const featuredSnapshot = await getDocs(featuredQuery)
        if (!featuredSnapshot.empty) {
          const doc = featuredSnapshot.docs[0]
          setFeaturedPost({ id: doc.id, ...doc.data() } as Post)
        }

        // Lấy các bài còn lại (đã duyệt, không featured hoặc featured cũ)
        const postsQuery = query(
          collection(db, POSTS_COLLECTION),
          where('status', '==', 'Đã duyệt'),
          orderBy('createdAt', 'desc'),
          limit(10)
        )
        const postsSnapshot = await getDocs(postsQuery)
        const postList = postsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Post))
        setPosts(postList)
      } catch (error) {
        console.error('Lỗi lấy bài viết:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  if (loading) {
    return (
      <section className='lg:col-span-6'>
        {/* Skeleton Hero */}
        <div className='mb-10 rounded-2xl bg-linear-to-r from-primary/20 to-primary/10 p-8 overflow-hidden shadow-xl'>
          <div className='max-w-3xl space-y-6'>
            <Skeleton className='h-12 w-3/4 rounded-lg' />
            <Skeleton className='h-6 w-full rounded-md' />
            <Skeleton className='h-6 w-2/3 rounded-md' />
            <div className='mt-6 flex items-center gap-4'>
              <Skeleton className='h-10 w-32 rounded-md' />
              <div className='flex items-center gap-2'>
                <Skeleton className='h-8 w-8 rounded-full' />
                <Skeleton className='h-5 w-40 rounded-md' />
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton danh sách bài viết */}
        <div className='space-y-6'>
          {Array.from({ length: 6 }).map((_, i) => (
            <article key={i} className='rounded-xl border bg-card p-6 shadow-sm'>
              <div className='flex flex-col md:flex-row gap-6'>
                <Skeleton className='md:w-1/3 h-48 rounded-lg' />
                <div className='flex-1 space-y-4'>
                  <Skeleton className='h-8 w-3/4 rounded-lg' />
                  <div className='space-y-2'>
                    <Skeleton className='h-5 w-full rounded-md' />
                    <Skeleton className='h-5 w-full rounded-md' />
                    <Skeleton className='h-5 w-2/3 rounded-md' />
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    <Skeleton className='h-6 w-16 rounded-md' />
                    <Skeleton className='h-6 w-16 rounded-md' />
                    <Skeleton className='h-6 w-16 rounded-md' />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <Skeleton className='h-8 w-8 rounded-full' />
                      <Skeleton className='h-5 w-32 rounded-md' />
                    </div>
                    <div className='flex gap-4'>
                      <Skeleton className='h-5 w-16 rounded-md' />
                      <Skeleton className='h-5 w-16 rounded-md' />
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className='lg:col-span-6'>
      {/* Hero - Bài nổi bật (nếu có) */}
      {featuredPost ? (
        <div className='mb-10 rounded-2xl bg-linear-to-r from-primary to-primary/80 p-8 text-primary-foreground overflow-hidden shadow-xl'>
          <div className='max-w-3xl'>
            <h2 className='text-h2 font-extrabold leading-tight'>{featuredPost.title}</h2>
            <p className='mt-4 text-primary-foreground/90 text-body line-clamp-3'>
              {featuredPost.content.substring(0, 200)}...
            </p>
            <div className='mt-6 flex items-center gap-4'>
              <Button variant='secondary' size='lg' asChild>
                <Link to={`/post/${featuredPost.id}`}>Đọc ngay</Link>
              </Button>
              <div className='text-sm opacity-80 flex items-center gap-2'>
                <Avatar className='h-8 w-8'>
                  <AvatarImage src={featuredPost.authorPhotoURL || 'https://github.com/shadcn.png'} />
                  <AvatarFallback>{featuredPost.authorName?.[0]?.toUpperCase() || 'A'}</AvatarFallback>
                </Avatar>
                <span>
                  {featuredPost?.authorName} • {featuredPost.createdAt.toDate().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className='mb-10 rounded-2xl bg-muted p-8 text-center text-muted-foreground'>
          Chưa có bài viết nổi bật nào
        </div>
      )}

      {/* Danh sách bài viết */}
      <div className='space-y-6'>
        {posts.map((post) => (
          <article
            key={post.id}
            className='rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300'
          >
            <div className='flex flex-col md:flex-row gap-6'>
              {post.image && (
                <div className='md:w-1/3'>
                  <img src={post.image} alt={post.title} className='w-full h-48 object-cover rounded-lg' />
                </div>
              )}
              <div className='flex-1'>
                <h2 className='text-h3 font-bold text-foreground hover:text-primary transition-colors mb-3'>
                  <Link to={`/post/${post.id}`}>{post.title}</Link>
                </h2>
                <p className='text-body text-muted-foreground mb-4 line-clamp-3'>{post.content.substring(0, 200)}...</p>
                <div className='flex flex-wrap gap-2 mb-4'>
                  {post.tags?.map((tag) => (
                    <Badge key={tag} variant='secondary' className='text-xs'>
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className='flex items-center justify-between text-sm text-muted-foreground'>
                  <div className='flex items-center gap-3'>
                    <Avatar className='h-8 w-8'>
                      <AvatarImage src={post.authorPhotoURL || 'https://github.com/shadcn.png'} />
                      <AvatarFallback>{post.authorName?.[0]?.toUpperCase() || 'A'}</AvatarFallback>
                    </Avatar>
                    <span>
                      {post.authorName} • {post.createdAt.toDate().toLocaleDateString()}
                    </span>
                  </div>
                  <div className='flex gap-4'>
                    <button className='hover:text-primary transition-colors'>Like ({post.likesCount})</button>
                    <button className='hover:text-primary transition-colors'>Comment</button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {posts.length === 0 && (
        <div className='text-center py-12 text-muted-foreground text-lg'>Chưa có bài viết nào</div>
      )}
    </section>
  )
}

export default MainFeed
 bạn custom lại UI tìm kiếm hiện tên bài viết nhé