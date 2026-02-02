import type { Timestamp } from 'firebase/firestore'
export enum PostStatus {
  PENDING = 'Đang chờ duyệt',
  APPROVED = 'Đã duyệt',
  REJECTED = 'Huỷ'
}
export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN'
}
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  BANNED = 'BANNED'
}
export interface Post {
  id: string // ID document tự sinh
  title: string // Tiêu đề
  slug: string // URL thân thiện
  content: string // Nội dung đầy đủ (markdown hoặc HTML)
  image?: string // URL ảnh bìa (từ Storage)
  tags?: string[] } // Mảng tag (optional)
  category: string // Danh mục lớn (do admin gán)
  authorId: string // UID người viết
  authorName: string // Tên hiển thị
  status: PostStatus // Trạng thái
  rejectReason?: string // ← Lý do từ chối (chỉ có khi status = REJECTED)
  createdAt: Timestamp // Ngày tạo
  updatedAt: Timestamp // Ngày cập nhật
  likesCount: number // Số lượt thích
  viewsCount: number // Số lượt xem
  commentsCount: number // Số bình luận
  isFeatured: boolean // true nếu bài viết nổi bật
  authorPhotoURL?: string
}
export interface User {
  id: string // document ID (thường là uid)
  uid: string // uid từ Firebase Auth
  displayName: string // có thể optional nếu chưa set
  email: string // có thể optional
  role: Role
  createdAt: Timestamp // từ Firestore
  // Nếu sau này thêm field khác thì bổ sung ở đây, ví dụ:
  photoURL?: string
  lastLogin?: Timestamp
  status?: UserStatus
}
// 1. Từ tên danh mục tiếng Việt → slug (dùng cho URL)
export const categoryMapping: Record<string, string> = {
  'Hướng dẫn chơi game': 'game',
  Esports: 'esports',
  'Review game': 'review',
  'Mẹo & Thủ thuật': 'tips'
}

// 2. Từ slug → tên danh mục tiếng Việt thật (dùng để tìm trong Firestore)
export const slugToCategoryName: Record<string, string> = {
  game: 'Hướng dẫn chơi game',
  esports: 'Esports',
  review: 'Review game',
  tips: 'Mẹo & Thủ thuật'
}
// Hằng số mặc định khi tạo bài mới (dùng ở WritePage)
export const DEFAULT_POST_STATUS: PostStatus = PostStatus.PENDING

// Tên collection trong Firestore (dùng chung mọi nơi)
export const POSTS_COLLECTION = 'posts'
export const USERS_COLLECTION = 'users'
