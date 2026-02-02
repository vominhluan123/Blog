import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/useAuth'
import { auth } from '@/firebase/firebase-config'
import AdminSidebar from '@/pages/admin/AdminSidebar'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

const AdminLayout = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const handleLogout = async () => {
    await auth.signOut()
    toast.success('Đăng xuất thành công')
    navigate('/login')
  }

  return (
    <div className='min-h-screen flex bg-background'>
      {/* Sidebar trái */}
      <AdminSidebar />

      {/* Main content */}
      <div className='flex-1 p-8'>
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-2xl font-bold'>Quản lý Blog</h1>
          <Button variant='ghost' onClick={handleLogout}>
            <LogOut className='h-5 w-5 mr-2' />
            Đăng xuất
          </Button>
        </div>
        <Outlet />
      </div>
    </div>
  )
}

export default AdminLayout
