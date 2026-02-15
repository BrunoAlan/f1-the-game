import { useEffect } from 'react'
import { motion } from 'framer-motion'

interface RadioAlertProps {
  message: string
  onDismiss: () => void
}

export function RadioAlert({ message, onDismiss }: RadioAlertProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="fixed bottom-4 right-4 max-w-sm bg-slate-900 border-2 border-f1-border p-4 font-pixel z-50"
    >
      <div className="text-f1-accent text-[10px] mb-2">{'\uD83D\uDCFB'} RADIO</div>
      <div className="text-f1-text text-[10px] leading-relaxed">{message}</div>
    </motion.div>
  )
}
