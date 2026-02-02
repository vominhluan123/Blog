export function createSlug(name: string): string {
  if (!name) return 'user-' + Math.random().toString(36).slice(2, 8)

  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // loại bỏ dấu
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '') // chỉ giữ chữ, số, khoảng trắng, dấu gạch
    .replace(/\s+/g, '-') // thay khoảng trắng bằng -
    .replace(/-+/g, '-') // tránh nhiều dấu gạch liên tiếp
    .replace(/^-+|-+$/g, '') // loại bỏ dấu gạch đầu/cuối
}

// Nếu muốn tạo slug unique hơn (khi đăng ký/update profile)
export function generateUniqueSlug(baseName: string, existingSlugs: Set<string>): string {
  let slug = createSlug(baseName)
  let counter = 1
  let finalSlug = slug

  while (existingSlugs.has(finalSlug)) {
    finalSlug = `${slug}-${counter}`
    counter++
  }

  return finalSlug
}
