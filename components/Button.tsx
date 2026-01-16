import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'glass' | 'vibrant';
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  isLoading,
  ...props 
}) => {
  const baseStyle = "px-6 py-3 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center relative overflow-hidden tracking-wide text-sm";
  
  const variants = {
    primary: "bg-white text-black hover:bg-indigo-50 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]",
    secondary: "bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20",
    glass: "bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 hover:scale-105",
    vibrant: "bg-gradient-to-r from-orange-500 via-pink-500 to-indigo-500 text-white border border-white/20 shadow-[0_0_30px_rgba(236,72,153,0.4)] hover:shadow-[0_0_50px_rgba(236,72,153,0.6)]"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
            <span className="animate-spin h-4 w-4 border-[2px] border-current border-t-transparent rounded-full" />
            <span className="opacity-90">Dreaming...</span>
        </span>
      ) : children}
      
      {/* Shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
    </motion.button>
  );
};