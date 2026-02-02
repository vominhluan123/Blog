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
        <TooltipTrigger>
          <Gamepad2
            className={`h-10 w-10 transition-all duration-500 ${
              isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
            }`}
          />

          <Gamepad2
            className={`absolute h-10 w-10 text-white transition-all duration-500 ${
              isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
            }`}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>Add to library</p>
        </TooltipContent>
      </Tooltip>

      <span className='sr-only'>Chuyển chế độ sáng/tối</span>
    </Button>
  )
}
