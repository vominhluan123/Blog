import { Gamepad2, Sparkles, Zap } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useTheme } from './theme-provider'

export function ModeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='icon'>
          <Gamepad2 className='h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-180 dark:scale-0' />
          <Gamepad2 className='absolute h-5 w-5 rotate-180 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-600-400' />
          <span className='sr-only'>Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Zap className='mr-2 h-4 w-4 text-yellow-500' />
          Light Mode (Năng lượng ban ngày)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Gamepad2 className='mr-2 h-4 w-4 text-purple-500' />
          Dark Mode (Gaming đêm khuya)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Sparkles className='mr-2 h-4 w-4' />
          Tự động
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
