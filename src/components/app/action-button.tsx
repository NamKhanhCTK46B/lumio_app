'use client'

import { useFormStatus } from 'react-dom'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

type ActionButtonProps = Omit<ButtonProps, 'disabled'> & {
  loadingText?: string
  isPending?: boolean
  disabled?: boolean
}

/**
 * Button với auto-loading state cho forms hoặc manual control cho client transitions.
 *
 * Use cases:
 * - Form submit: tự động detect pending từ useFormStatus()
 * - Client actions: pass isPending từ useTransition()
 * - Async operations: pass isPending từ useState
 *
 * Tương tự SubmitButton trong auth nhưng generic hơn cho toàn app.
 */
export function ActionButton({
  children,
  loadingText,
  isPending: externalPending,
  disabled,
  ...props
}: ActionButtonProps) {
  const formStatus = useFormStatus()
  const pending = externalPending ?? formStatus.pending

  return (
    <Button
      disabled={disabled || pending}
      {...props}
    >
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
