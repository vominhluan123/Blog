import { createBrowserRouter } from 'react-router'
import { AuthRoute } from './components/auth/AuthRoute'
import { VerifiedRoute } from './components/auth/VerifiedRoute'
import AdminLayout from './components/layouts/admin/AdminLayout'
import AdminPosts from './pages/admin/AdminPosts'
import { AdminRoute } from './pages/admin/Adminroute'
import AdminUsers from './pages/admin/AdminUsers'
import CategoryPage from './pages/CategoryPage'
import ContactPage from './pages/ContactPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import PostDetail from './pages/PostDetail'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import RootLayout from './pages/RootLayout'
import VerifyEmailPage from './pages/VerifyEmailPage'
import WritePage from './pages/WritePage'

export const router = createBrowserRouter([
  // 1. Nhóm có RootLayout (các trang bình thường)
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
        children
      },
      {
        path: '/contact',
        element: <ContactPage />
      },
      {
        path: '/post/:id',
        element: <PostDetail />
      },
    
      // ================== TRANG PROTECTED (CHỈ ĐÃ LOGIN MỚI VÀO) ==================
      {
        element: <VerifiedRoute />, // Gác cổng ở đây
        children: [
          {
            path: '/write',
            element: <WritePage />
          },
          {
            path: '/profile',
            element: <ProfilePage />
          },
          {
            path: '/my-posts',
            element: <div>Bài viết của tôi (sắp làm)</div>
          }

          // Thêm các trang protected khác ở đây
        ]
      }
    ]
  },
  // 2. Nhóm KHÔNG có RootLayout → Login & Register riêng biệt
  {
    element: <AuthRoute />, // Gác cổng: nếu đã login thì đuổi về trang chủ
    children: [
      {
        path: '/login',
        element: <LoginPage />
      },
      {
        path: '/register',
        element: <RegisterPage />
      },
      {
        path: '/forgot-password',
        element: <ForgotPasswordPage />
      },
      {
        path: '/verify-email',
        element: <VerifyEmailPage />
      }
    ]
  },
  // 3. Nhóm Admin
  {
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            path: 'admin/posts',
            element: <AdminPosts />
          },
          { path: '/admin/users', element: <AdminUsers /> },
          { path: '/admin/settings', element: <div>Cài đặt (sắp làm)</div> }
        ]
      }
    ]
  },
  //  trang 404
  {
    path: '*',
    element: <div className='flex items-center justify-center min-h-screen text-3xl'>404 - Không tìm thấy</div>
  }
])
