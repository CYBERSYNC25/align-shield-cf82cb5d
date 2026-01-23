import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StepContainerProps {
  children: ReactNode;
  className?: string;
}

const StepContainer = ({ children, className }: StepContainerProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 py-8',
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export default StepContainer;
