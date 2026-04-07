import { memo, useMemo } from 'react';
import { svgPaths } from './symbols';

export type IconName = keyof typeof svgPaths;

interface IconProps {
  name: IconName;
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

const Icon = ({
  name,
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
  style,
}: IconProps) => {
  const iconStyle = useMemo(
    () => ({
      width: typeof size === 'number' ? `${size}px` : size,
      height: typeof size === 'number' ? `${size}px` : size,
      color,
      ...style,
    }),
    [size, color, style]
  );

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`icon icon-${name} ${className}`}
      style={iconStyle}
    >
      <path d={svgPaths[name]} />
    </svg>
  );
};

export default memo(Icon);
