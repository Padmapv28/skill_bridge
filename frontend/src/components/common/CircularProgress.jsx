import React from 'react';
import { motion } from 'framer-motion';

/**
 * Animated SVG Circular Progress Ring
 * Displays match percentage with dynamic theme coloring
 */
export const CircularProgress = ({
  percentage = 75,
  size = 140,
  strokeWidth = 10,
  label = 'Skill Match',
  showLabel = true
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(percentage, 0), 100);
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  // Determine color theme based on score
  let strokeColor = '#10B981'; // Green for high match >= 80%
  let glowColor = 'rgba(16, 185, 129, 0.4)';
  let badgeColor = 'text-status-success';

  if (clamped < 60) {
    strokeColor = '#F43F5E'; // Red/Rose for low
    glowColor = 'rgba(244, 63, 94, 0.4)';
    badgeColor = 'text-status-danger';
  } else if (clamped < 80) {
    strokeColor = '#F59E0B'; // Gold for medium
    glowColor = 'rgba(245, 158, 11, 0.4)';
    badgeColor = 'text-brand-gold';
  }

  return (
    <div className="flex flex-col items-center justify-center relative select-none" style={{ width: size, height: size }}>
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`} 
        className="transform -rotate-90"
        aria-hidden="true"
      >
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#141E34"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Animated Progress Ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          strokeLinecap="round"
          fill="transparent"
          style={{
            filter: `drop-shadow(0 0 6px ${glowColor})`
          }}
        />
      </svg>

      {/* Center Label & Score */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.span 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className={`font-mono text-2xl md:text-3xl font-bold tracking-tight ${badgeColor}`}
        >
          {clamped}%
        </motion.span>
        {showLabel && (
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mt-0.5">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

export default CircularProgress;
