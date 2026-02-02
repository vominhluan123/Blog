import { Button } from '@/components/ui/button'
import { Gamepad2 } from 'lucide-react'
import { useTheme } from '@/components/theme-provider' // Đường dẫn đúng của bạn

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  // Hàm toggle: nếu đang dark → light, ngược lại → dark
  // (Không quan tâm 'system' vì click nghĩa là user muốn override)
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  // Xác định icon hiện tại dựa trên theme thực tế (không phải 'system')
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <Button
      variant='ghost'
      size='icon'
      onClick={toggleTheme}
      className='rounded-full hover:bg-accent/80 transition-all'
      aria-label='Chuyển chế độ sáng/tối'
    >
      {/* Icon Light Mode - hiện khi đang light */}
      <Gamepad2
        className={`h-5 w-5 transition-all duration-500 ${
          isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
        }`}
      />

      {/* Icon Dark Mode - hiện khi đang dark (màu tím gaming) */}
      <Gamepad2
        className={`absolute h-5 w-5 text-purple-400 transition-all duration-500 ${
          isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
        }`}
      />

      <span className='sr-only'>Chuyển chế độ sáng/tối</span>
    </Button>
  )
}
