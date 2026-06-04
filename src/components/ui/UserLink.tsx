import { Link } from 'react-router-dom';
import { profilePath } from '../../lib/profilePaths';
import './UserLink.css';

interface UserLinkProps {
  userId: string;
  children: React.ReactNode;
  className?: string;
  title?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const UserLink: React.FC<UserLinkProps> = ({ userId, children, className = '', title, onClick }) => (
  <Link
    to={profilePath(userId)}
    className={`user-link ${className}`.trim()}
    title={title}
    onClick={onClick}
    draggable={false}
    onDragStart={e => e.preventDefault()}
  >
    {children}
  </Link>
);

export default UserLink;
