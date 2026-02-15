interface PixelButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'danger' | 'success' | 'warning'
  disabled?: boolean
  className?: string
}

const variantStyles: Record<string, string> = {
  default: 'border-f1-border hover:text-f1-accent hover:border-f1-accent',
  danger: 'border-f1-danger/60 hover:text-f1-danger hover:border-f1-danger',
  success: 'border-f1-success/60 hover:text-f1-success hover:border-f1-success',
  warning: 'border-f1-warning/60 hover:text-f1-warning hover:border-f1-warning',
}

export function PixelButton({
  children,
  onClick,
  variant = 'default',
  disabled = false,
  className = '',
}: PixelButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`border-2 bg-slate-800 hover:bg-slate-700 px-4 py-3 font-pixel text-[10px] text-f1-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
