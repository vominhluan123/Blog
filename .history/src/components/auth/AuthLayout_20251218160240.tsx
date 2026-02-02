import { Gamepad2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

interface AuthLayoutProps {
  title: string
  children: ReactNode
}

const AuthLayout = ({ title, children }: AuthLayoutProps) => {
  return (
    <div className='min-h-screen p-10 flex items-center justify-center'>
      <div className='container w-full mx-auto max-w-5xl p-5'>
        <Link  alt='MyGameBlog' className='mx-auto mb-10 h-20 w-20' ><Gamepad2/></Link>
        <h1 className='text-center text-xl text-primary font-semibold mb-5'>{title}</h1>
        {children}
      </div>
    </div>
  )
}

export default AuthLayout
