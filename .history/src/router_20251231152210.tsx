import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

export const router = createBrowserRouter([
  // Nhóm 1: Tất cả các trang cần login + verify email (bao gồm cả trang chủ)
  {
    element: <VerifiedRoute />, // Bắt buộc phải login VÀ emailVerified
    children: [
      {
        element: <RootLayout />,
        children: [
          {
            path: '/',
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
          // Các trang protected (đã verify rồi thì vào bình thường)
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
            element: <div>Bài viết của tôi</div>
          }
        ]
      }
    ]
  },

  // Nhóm 2: Các trang authentication – chỉ cho vào nếu CHƯA login
  // (đã login thì đuổi về trang chủ – nhưng vì trang chủ cũng verified, sẽ tự redirect tiếp)
  {
    element: <AuthRoute />,
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

  // Admin (giữ nguyên)
  {
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            path: 'admin/posts',
            element: <AdminPosts />
          }
          // ...
        ]
      }
    ]
  },

  // 404
  {
    path: '*',
    element: <div className='flex items-center justify-center min-h-screen text-3xl'>404 - Không tìm thấy</div>
  }
])
