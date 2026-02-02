import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'

export const PasswordInput = ({ className = '', ...props }) => {
  const [show, setShow] = useState(false)

  return (
    <div className='relative w-full'>
      <Input type={show ? 'text' : 'password'} className={`pr-10 ${className}`} {...props} />

      <button
        type='button'
        onClick={() => setShow(!show)}
        className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black'
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}
