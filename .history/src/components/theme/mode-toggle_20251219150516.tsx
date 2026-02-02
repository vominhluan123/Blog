import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            onClick={toggleTheme}
            className='relative rounded-full hover:bg-accent/80 transition-all h-10 w-10'
            aria-label='Chuyển chế độ sáng/tối'
          >
            <Gamepad2
              className={`h-6 w-6 transition-all duration-500 absolute inset-0 m-auto ${
                isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
              }`}
            />

            <Gamepad2
              className={`h-6 w-6 transition-all duration-500 absolute inset-0 m-auto text-white ${
                isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
              }`}
            />

            <span className='sr-only'>Chuyển chế độ sáng/tối</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side='bottom' className='bg-muted-f text-muted-foreground'>
          <p>{isDark ? 'Chế độ tối' : 'Chế độ sáng'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
