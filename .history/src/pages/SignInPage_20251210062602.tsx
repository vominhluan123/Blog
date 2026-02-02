import { useAuth } from '@/contexts/useAuth'

const SignInPage = () => {
  const { user } = useAuth()
  return <div>SignInPage</div>
}

export default SignInPage
