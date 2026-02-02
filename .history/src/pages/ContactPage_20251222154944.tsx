import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const ContactPage = () => {
  const searchInputClass = cn(
    'hidden md:block px-4 py-2 rounded-full border',
    'bg-background/80 text-foreground placeholder-muted-foreground/70',
    'transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-background w-64 backdrop-blur-sm',
    'dark:bg-background/50 dark:border-primary/20',
    'dark:focus:ring-primary/70 dark:focus:shadow-lg dark:focus:shadow-primary/30'
  )
  return (
    <div className='max-w-4xl mx-auto py-12'>
      <h1 className='text-h1 font-extrabold text-center mb-12'>Liên hệ với chúng tôi</h1>

      <div className='grid md:grid-cols-2 gap-12'>
        {/* Form liên hệ */}
        <Card>
          <CardHeader>
            <CardTitle>Gửi tin nhắn</CardTitle>
            <CardDescription>Chúng tôi sẽ trả lời trong vòng 24h</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex flex-col w-full max-w-sm items-start gap-3 mx-auto mb-5'>
              <Label htmlFor='name'>Họ tên</Label>
              <Input className={searchInputClass} id='name' placeholder='Nhập tên của bạn' />

              <Label htmlFor='email'>Email</Label>
              <Input id='email' type='email' className={searchInputClass} placeholder='email@example.com' />

              <Label htmlFor='message'>Tin nhắn</Label>
              <Textarea className={searchInputClass,''} id='message' placeholder='Nội dung bạn muốn hỏi...' />
            </div>
            <Button className='w-full'>Gửi tin nhắn</Button>
          </CardContent>
        </Card>

        {/* Thông tin liên hệ khác */}
        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Thông tin liên hệ</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4 text-muted-foreground'>
              <p>
                <strong>Email:</strong> luan.gamer@example.com
              </p>
              <p>
                <strong>Discord:</strong> discord.gg/mygameblog
              </p>
              <p>
                <strong>Facebook:</strong> fb.com/mygameblog
              </p>
              <p>
                <strong>Zalo:</strong> 0123 456 789
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Góp ý & Hợp tác</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>
                Bạn muốn viết bài guest post, quảng cáo, hoặc hợp tác? Hãy liên hệ ngay!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ContactPage
