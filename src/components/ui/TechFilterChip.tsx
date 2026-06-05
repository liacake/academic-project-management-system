import { Link } from 'react-router-dom';
import { projectsPathWithTech } from '../../lib/projectFilters';
import './TechFilterChip.css';

interface TechFilterChipProps {
  techId: string;
  children: React.ReactNode;
  className?: string;
  title?: string;
  style?: React.CSSProperties;
}

const TechFilterChip: React.FC<TechFilterChipProps> = ({
  techId,
  children,
  className = '',
  title,
  style,
}) => (
  <Link
    to={projectsPathWithTech(techId)}
    className={`tech-filter-chip ${className}`.trim()}
    title={title}
    style={style}
    onClick={e => e.stopPropagation()}
  >
    {children}
  </Link>
);

export default TechFilterChip;
