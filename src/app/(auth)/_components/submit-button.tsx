'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

type SubmitButtonProps = {
  children: React.ReactNode
  loadingText?: string
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

/**
 * Button submit với loading state tự động từ useFormStatus().
 *
 * Dùng cho server action forms — tự động show spinner + disable khi đang submit.
 * Tránh double submission và cải thiện UX với visual feedback.
 */
export function SubmitButton({
  children,
  loadingText = 'Đang xử lý...',
  size = 'lg',
  className
}: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      size={size}
      disabled={pending}
      className={className}
    >
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
