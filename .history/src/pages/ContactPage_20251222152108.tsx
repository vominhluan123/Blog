import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

const ContactPage = () => {
  return (
    <div className='max-w-4xl mx-auto py-12'>
      <h1 className='text-h1 font-extrabold text-center mb-12'>Liên hệ với chúng tôi</h1>

      <div className='grid md:grid-cols-2 gap-12'>
        {/* Form liên hệ (giả lập, sau này kết nối backend) */}
        <Card>
          <CardHeader>
            <CardTitle>Gửi tin nhắn</CardTitle>
            <CardDescription>Chúng tôi sẽ trả lời trong vòng 24h</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <Label htmlFor='name'>Họ tên</Label>
              <Input id='name' placeholder='Nhập tên của bạn' />
            </div>
            <div>
              <Label htmlFor='email'>Email</Label>
              <Input id='email' type='email' placeholder='email@example.com' />
            </div>
            <div>
              <Label htmlFor='message'>Tin nhắn</Label>
              <Textarea id='message' rows={5} placeholder='Nội dung bạn muốn hỏi...' />
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
