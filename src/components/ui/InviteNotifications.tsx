import { Bell, Check, X } from 'lucide-react';
import { useInvites } from '../../context/InviteContext';
import './InviteNotifications.css';

const InviteNotifications: React.FC = () => {
  const { pendingInvites, respondToInvite } = useInvites();

  if (pendingInvites.length === 0) return null;

  return (
    <div className="invite-notifications">
      {pendingInvites.map(invite => (
        <div key={invite.id} className="invite-banner">
          <div className="invite-banner-icon"><Bell size={14} /></div>
          <div className="invite-banner-body">
            <span className="invite-banner-text">
              <strong>{invite.invitedByName}</strong> invited you to coordinate{' '}
              <strong>{invite.projectTitle}</strong>
            </span>
            <span className="invite-banner-sub">You'll be able to manage team members and project status.</span>
          </div>
          <div className="invite-banner-actions">
            <button className="invite-btn invite-btn--accept" onClick={() => respondToInvite(invite.id, true)}>
              <Check size={12} /> Accept
            </button>
            <button className="invite-btn invite-btn--decline" onClick={() => respondToInvite(invite.id, false)}>
              <X size={12} /> Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InviteNotifications;
