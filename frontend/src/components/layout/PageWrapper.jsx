import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Animated Page Transition Wrapper
 * Applies subtle fade/rise motion while respecting system prefers-reduced-motion setting
 */
export const PageWrapper = ({ children, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    initial: shouldReduceMotion 
      ? { opacity: 1, y: 0 } 
      : { opacity: 0, y: 14 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.35,
        ease: [0.25, 0.1, 0.25, 1],
      }
    },
    exit: shouldReduceMotion 
      ? { opacity: 1, y: 0 } 
      : { 
        opacity: 0, 
        y: -10,
        transition: {
          duration: shouldReduceMotion ? 0 : 0.2,
          ease: [0.25, 0.1, 0.25, 1],
        }
      }
  };

  return (
    <motion.main
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      className={`min-h-[calc(100vh-80px)] flex flex-col ${className}`}
    >
      {children}
    </motion.main>
  );
};

export default PageWrapper;
