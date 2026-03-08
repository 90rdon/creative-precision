import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  icon,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 px-6 py-3 transition-all duration-300 ease-out font-sans tracking-wide text-sm font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-400";
  
  const variants = {
    primary: "bg-sand-900 text-white hover:bg-stone-800 border border-transparent shadow-sm",
    secondary: "bg-transparent border border-stone-300 text-sand-900 hover:border-stone-500 hover:bg-stone-100/50",
    ghost: "bg-transparent text-stone-600 hover:text-sand-900 hover:bg-stone-100/50"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      {...props}
    >
      {children}
      {icon && <span className="ml-1">{icon}</span>}
    </button>
  );
};
