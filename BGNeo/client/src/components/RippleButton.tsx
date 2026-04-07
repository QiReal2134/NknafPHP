import { type ReactNode, useCallback } from 'react';
import { useRipple } from '../hooks/useRipple';

interface RippleButtonProps {
  children: ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  rippleColor?: string;
  disabled?: boolean;
}

export default function RippleButton({
  children,
  onClick,
  className = '',
  rippleColor = 'rgba(137,180,250,0.4)',
  disabled = false,
}: RippleButtonProps) {
  const { ref, createRipple } = useRipple({ color: rippleColor });

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      createRipple(e);
      onClick?.(e);
    },
    [createRipple, onClick, disabled]
  );

  return (
    <button
      ref={ref as any}
      className={`ripple-btn ${className}${disabled ? ' ripple-disabled' : ''}`}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
