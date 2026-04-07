import { useTextReveal } from '../hooks/useTextReveal';

interface AnimatedTextProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  mode?: 'chars' | 'words' | 'lines';
  stagger?: number;
  delay?: number;
  className?: string;
}

export default function AnimatedText({
  text,
  as: Tag = 'span',
  mode = 'chars',
  stagger = 40,
  delay = 0,
  className = '',
}: AnimatedTextProps) {
  const { containerRef } = useTextReveal(text, { mode, stagger, delay });

  return (
    <Tag ref={containerRef as any} className={`animated-text ${className}`} />
  );
}
