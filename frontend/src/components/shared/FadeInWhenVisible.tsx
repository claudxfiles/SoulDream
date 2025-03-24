'use client';

import React, { useEffect, ReactNode } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface FadeInWhenVisibleProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export const FadeInWhenVisible: React.FC<FadeInWhenVisibleProps> = ({ 
  children, 
  delay = 0, 
  className = "" 
}) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      animate={controls}
      initial="hidden"
      transition={{ duration: 0.5, delay }}
      variants={{
        visible: { opacity: 1, y: 0 },
        hidden: { opacity: 0, y: 50 }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}; 