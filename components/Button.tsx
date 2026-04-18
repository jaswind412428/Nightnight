import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "relative font-['Orbitron'] font-bold uppercase tracking-wider py-3 px-6 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 group overflow-hidden rounded-sm";
  
  const variants = {
    // Primary: Neon Pink
    primary: "bg-fuchsia-900/40 text-fuchsia-400 border border-fuchsia-500 hover:bg-fuchsia-500 hover:text-black hover:shadow-[0_0_20px_rgba(236,72,153,0.6)]",
    
    // Secondary: Neon Cyan/Blue
    secondary: "bg-cyan-900/20 text-cyan-400 border border-cyan-500 hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_20px_rgba(6,182,212,0.6)]",
    
    // Danger: Red
    danger: "bg-red-900/20 text-red-500 border border-red-500 hover:bg-red-600 hover:text-white hover:shadow-[0_0_20px_rgba(220,38,38,0.6)]",
    
    // Ghost: Subtle
    ghost: "bg-transparent text-slate-400 hover:text-fuchsia-400"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </button>
  );
};

export default Button;