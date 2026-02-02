import type { Timestamp } from 'firebase/firestore'
import { type User as FirebaseUser } from 'firebase/auth'
export enum PostStatus {
  PENDING = 'Đang chờ duyệt',
  APPROVED = 'Đã duyệt',
  REJECTED = 'Huỷ'
}
export enum Role {
  USER = 'user',
  ADMIN = 'admin'
}
export interface Post {
  id: string // ID document tự sinh
  title: string // Tiêu đề
  slug: string // URL thân thiện
  content: string // Nội dung đầy đủ (markdown hoặc HTML)
  image?: string // URL ảnh bìa (từ Storage)
  tags?: string[] // Mảng tag (optional)
  category: string // Danh mục lớn (do admin gán)
  authorId: string // UID người viết
  authorName: string // Tên hiển thị
  status: PostStatus // Trạng thái
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
  // photoURL?: string;
  // lastLogin?: Timestamp;
  // status?: 'active' | 'banned';
}
// Hằng số mặc định khi tạo bài mới (dùng ở WritePage)
export const DEFAULT_POST_STATUS: PostStatus = PostStatus.PENDING

// Tên collection trong Firestore (dùng chung mọi nơi)
export const POSTS_COLLECTION = 'posts'
export const USERS_COLLECTION = 'users'
