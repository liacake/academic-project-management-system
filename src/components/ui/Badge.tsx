import './Badge.css';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  color?: string;
  size?: 'sm' | 'md';
}

const Badge: React.FC<BadgeProps> = ({ label, variant = 'default', color, size = 'sm' }) => {
  const style = color ? { backgroundColor: `${color}22`, color, borderColor: `${color}44` } : undefined;

  return (
    <span
      className={`badge badge--${variant} badge--${size}`}
      style={style}
    >
      {label}
    </span>
  );
};

export default Badge;
