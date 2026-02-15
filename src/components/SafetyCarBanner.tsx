import { AnimatePresence, motion } from 'framer-motion'

interface SafetyCarBannerProps {
  active: boolean
}

export function SafetyCarBanner({ active }: SafetyCarBannerProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          className="fixed top-0 left-0 right-0 z-50 bg-f1-warning/90 py-2 text-center font-pixel text-[12px] text-slate-900 font-bold animate-pulse"
        >
          {'\u26A0\uFE0F'} SAFETY CAR
        </motion.div>
      )}
    </AnimatePresence>
  )
}
