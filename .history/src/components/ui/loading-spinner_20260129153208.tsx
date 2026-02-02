// components/ui/loading-spinner.tsx
export function LoadingSpinner({ message = 'Đang tải...' }: { message?: string }) {
  return (
    <div className='flex flex-col items-center justify-center gap-3 py-8'>
      <div className='relative'>
        <div className='h-10 w-10 rounded-full border-4 border-primary/30 animate-spin border-t-primary' />
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='h-4 w-4 rounded-full bg-primary/20 animate-ping' />
        </div>
      </div>
      {message && <p className='text-sm text-muted-foreground'>{message}</p>}
    </div>
  )
}
