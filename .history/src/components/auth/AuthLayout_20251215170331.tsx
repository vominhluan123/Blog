import type { ReactNode } from 'react'

interface AuthLayoutProps {
  title: string
  children: ReactNode
}

const AuthLayout = ({ title, children }: AuthLayoutProps) => {
  return (
    <div className='min-h-screen p-10 flex items-center justify-center'>
      <div className='container w-full mx-auto max-w-5xl p-5'>
        <img srcSet='/public/favicon.svg 2x' alt='' className='mx-auto mb-10 h-20 w-20' />
        <h1 className='text-center text-xl text-primary font-semibold mb-5'>{title}</h1>
        {children}
      </div>
    </div>
  )
}

export default AuthLayout
