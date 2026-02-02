import { Gamepad2 } from 'lucide-react'
import React from 'react'
import { Link } from 'react-router'

const Footer = () => {
  return (
    <footer className='border-t bg-card mt-auto'>
      <div className='container mx-auto px-4 py-10'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8 text-sm'>
          {/* Cột 1: Logo + mô tả ngắn */}
          <div className='flex flex-col items-start'>
            <div className='flex items-center gap-3 mb-4'>
              <Gamepad2 className='h-8 w-8 text-primary' />
              <span className='text-xl font-bold'>MyGameBlog</span>
            </div>
            <p className='text-muted-foreground'>
              Blog chia sẻ kinh nghiệm chơi game, review, mẹo hay từ cộng đồng gamer Việt Nam.
            </p>
          </div>

          {/* Cột 2: Link nhanh */}
          <div>
            <h4 className='font-semibold mb-4'>Liên kết</h4>
            <ul className='space-y-2 text-muted-foreground'>
              <li>
                <Link to='/' className='hover:text-foreground transition'>
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link to='/contact' className='hover:text-foreground transition'>
                  Liên hệ
                </Link>
              </li>
              <li>
                <Link to='/about' className='hover:text-foreground transition'>
                  Về chúng tôi
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Liên hệ */}
          <div>
            <h4 className='font-semibold mb-4'>Liên hệ</h4>
            <ul className='space-y-2 text-muted-foreground'>
              <li>Email: luan.gamer@example.com</li>
              <li>Discord: discord.gg/mygameblog</li>
              <li>Facebook: fb.com/mygameblog</li>
            </ul>
          </div>
        </div>

        <div className='mt-8 pt-8 border-t text-center text-muted-foreground text-sm'>
          © 2025 MyGameBlog - All rights reserved
        </div>
      </div>
    </footer>
  )
}

export default Footer