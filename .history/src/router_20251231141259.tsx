import { createBrowserRouter } from 'react-router'
import { GuestRoute } from './components/auth/GuestRoute'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
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
import AdminPosts from './pages/admin/AdminPosts'
import { AdminRoute } from './pages/admin/Adminroute'

export const router = createBrowserRouter([
  // 1. Nhóm có RootLayout (các trang bình thường)
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />
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
        element: <ProtectedRoute />, // Gác cổng ở đây
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
    element: <GuestRoute />, // Gác cổng: nếu đã login thì đuổi về trang chủ
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
    children: [{ 
      element: <Ad
    }]
  },
  //  trang 404
  {
    path: '*',
    element: <div className='flex items-center justify-center min-h-screen text-3xl'>404 - Không tìm thấy</div>
  }
])
