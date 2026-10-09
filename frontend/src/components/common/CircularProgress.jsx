import React from 'react';
import { motion } from 'framer-motion';

/**
 * Animated SVG Circular Progress Ring
 * Displays match percentage with dynamic theme coloring and crisp typography
 */
export const CircularProgress = ({
  percentage,
  value,
  score,
  size = 140,
  strokeWidth = 10,
  label = 'Skill Match',
  showLabel = true,
  className = '',
}) => {
  // Support percentage, value, or score props gracefully
  const rawScore = typeof percentage === 'number' 
    ? percentage 
    : typeof value === 'number' 
    ? value 
    : typeof score === 'number' 
    ? score 
    : 75;

  const clamped = Math.min(Math.max(Math.round(rawScore), 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  // Determine color theme based on score
  let strokeColor = '#10B981'; // Emerald/Green for high match >= 80%
  let glowColor = 'rgba(16, 185, 129, 0.45)';
  let textColor = 'text-emerald-400';

  if (clamped < 60) {
    strokeColor = '#F43F5E'; // Rose/Red for low
    glowColor = 'rgba(244, 63, 94, 0.45)';
    textColor = 'text-rose-400';
  } else if (clamped < 80) {
    strokeColor = '#F59E0B'; // Amber/Gold for medium
    glowColor = 'rgba(245, 158, 11, 0.45)';
    textColor = 'text-amber-400';
  }

  return (
    <div 
      className={`flex flex-col items-center justify-center relative select-none ${className}`} 
      style={{ width: size, height: size }}
    >
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
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          strokeLinecap="round"
          fill="transparent"
          style={{
            filter: `drop-shadow(0 0 8px ${glowColor})`
          }}
        />
      </svg>

      {/* Single Center Score & Label (No duplicates) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <motion.span 
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className={`font-heading text-3xl font-extrabold tracking-tight ${textColor}`}
        >
          {clamped}%
        </motion.span>
        {showLabel && (
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mt-0.5">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

export default CircularProgress;
