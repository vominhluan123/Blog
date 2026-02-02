export enum PostStatus {
  PENDING = 'Đang chờ duyệt', // Khi submit mới
  APPROVED = 'Đã duyệt', // Admin duyệt ok, publish
  REJECTED = 'Huỷ' // Admin từ chối
}
