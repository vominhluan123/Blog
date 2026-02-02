import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Gamepad2 } from 'lucide-react'
import { useTheme } from './theme-provider'
export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <Button
      variant='ghost'
      size='default'
      onClick={toggleTheme}
      className='rounded-full hover:bg-accent/80 transition-all'
      aria-label='Chuyển chế độ sáng/tối'
    >
      <Tooltip>
        <TooltipTrigger>Hover</TooltipTrigger>
        <TooltipContent>
          <p>Add to library</p>
        </TooltipContent>
      </Tooltip>
      

      <span className='sr-only'>Chuyển chế độ sáng/tối</span>
    </Button>
  )
}
