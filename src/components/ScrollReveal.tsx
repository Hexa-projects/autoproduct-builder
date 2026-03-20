import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'left' | 'right' | 'none';
}

const directionMap = {
  up: { y: 20, x: 0 },
  left: { y: 0, x: -20 },
  right: { y: 0, x: 20 },
  none: { y: 0, x: 0 },
};

export function ScrollReveal({ children, className, delay = 0, direction = 'up' }: ScrollRevealProps) {
  const offset = directionMap[direction];
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offset, filter: 'blur(4px)' }}
      whileInView={{ opacity: 1, y: 0, x: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
