import React from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

interface Props {
  children: React.ReactNode;
  delayMs?: number;
  className?: string;
}

const RevealOnScroll: React.FC<Props> = ({ children, delayMs = 0, className = '' }) => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <div
      ref={ref}
      className={`transition-opacity duration-300 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      style={{ transitionDelay: isVisible ? `${delayMs}ms` : '0ms' }}
    >
      {children}
    </div>
  );
};

export default RevealOnScroll;