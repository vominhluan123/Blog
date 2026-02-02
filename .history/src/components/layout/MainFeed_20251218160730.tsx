import React from 'react'

const MainFeed = () => {
  return (
    <section className='lg:col-span-6'>
      <h1 className='text-h1 font-extrabold mb-10 text-primary'>Blog Game - Tips, Review & Hướng dẫn</h1>

      {/* Hero */}
      <div className='mb-10 rounded-2xl bg-primary p-8 text-primary-foreground'>
        <h2 className='text-h2 font-extrabold leading-tight'>Bài viết nổi bật</h2>
        <p className='mt-4 text-primary-foreground/90 text-body max-w-2xl'>
          Cập nhật mới nhất từ cộng đồng — tips, review, và phân tích meta.
        </p>
        <Button variant='secondary' size='lg' className='mt-6'>
          Đọc ngay
        </Button>
      </div>

      {/* Bài viết */}
      <div className='space-y-6'>
        {samplePosts.map((post) => (
          <article key={post.id} className='rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow'>
            <div className='flex gap-4'>
              <Avatar className='h-12 w-12'>
                <AvatarImage src='https://github.com/shadcn.png' />
                <AvatarFallback>LN</AvatarFallback>
              </Avatar>
              <div className='flex-1'>
                <h2 className='text-h3 font-bold text-foreground hover:text-primary transition-colors'>
                  <Link to={`/post/${post.id}`}>{post.title}</Link>
                </h2>
                <p className='text-body text-muted-foreground mt-2'>{post.excerpt}</p>
                <div className='mt-4 flex items-center justify-between text-sm text-muted-foreground'>
                  <div>
                    {post.author} • {post.date}
                  </div>
                  <div className='flex gap-4'>
                    <button className='hover:text-primary'>Like</button>
                    <button className='hover:text-primary'>Comment</button>
                    <button className='hover:text-primary'>Share</button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default MainFeed