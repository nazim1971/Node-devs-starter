interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'white';
  className?: string;
}

export function Spinner({ size = 'md', variant = 'default', className = '' }: SpinnerProps) {
  const sizeClass = size !== 'md' ? `spinner--${size}` : '';
  const variantClass = variant !== 'default' ? `spinner--${variant}` : '';
  const classes = ['spinner', sizeClass, variantClass, className].filter(Boolean).join(' ');
  return <span className={classes} aria-label="Loading" role="status" />;
}
