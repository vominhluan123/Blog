import { useAuth } from '@/contexts/useAuth'

const SignInPage = () => {
  const { user } = useAuth()
  console.log('🚀 ~ SignInPage ~ user:', user)
  return <div>SignInPage</div>
}

export default SignInPage
