import { memo } from 'react';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export interface AuroraBackgroundProps {
  children: ReactNode;
  className?: string;
  showAurora?: boolean;
  auroraIntensity?: 'subtle' | 'normal' | 'intense';
}

const customEase = [0.77, 0, 0.175, 1] as const;

export const AuroraBackground = memo(function AuroraBackground({
  children,
  className = '',
  showAurora = true,
  auroraIntensity = 'normal',
}: AuroraBackgroundProps) {
  const opacityMap = {
    subtle: 0.5,
    normal: 0.7,
    intense: 0.8,
  };

  const opacity = opacityMap[auroraIntensity];

  return (
    <div className={`relative bg-black overflow-hidden h-full ${className}`}>
      {showAurora && (
        <>
          <motion.div
            className="absolute -top-20 -right-20 w-[300px] h-[300px] 
                       bg-blue-500 rounded-full mix-blend-screen 
                       filter blur-[100px] pointer-events-none will-change-transform"
            style={{ opacity }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [opacity, opacity - 0.2, opacity],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: customEase,
            }}
          />

          <motion.div
            className="absolute -bottom-20 -left-20 w-[250px] h-[250px] 
                       bg-purple-500 rounded-full mix-blend-screen 
                       filter blur-[100px] pointer-events-none will-change-transform"
            style={{ opacity: opacity - 0.1 }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [opacity - 0.1, opacity - 0.3, opacity - 0.1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: customEase,
              delay: 1,
            }}
          />

          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                       w-[400px] h-[400px] bg-orange-500 rounded-full 
                       mix-blend-screen filter blur-[120px] pointer-events-none will-change-transform"
            style={{ opacity: opacity - 0.3 }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [opacity - 0.3, opacity - 0.5, opacity - 0.3],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: customEase,
              delay: 2,
            }}
          />
        </>
      )}

      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
});
