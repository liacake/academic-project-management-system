import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { User } from '../../types';
import strings from './strings';
import './UserSearch.css';
import './MemberInvitePicker.css';

const MAX_SUGGESTIONS = 5;

interface MemberInvitePickerProps {
  users: User[];
  selected: User[];
  ownerId?: string;
  onAdd: (user: User) => void;
  onRemove: (userId: string) => void;
  placeholder?: string;
}

function matchesMemberQuery(user: User, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    user.name.toLowerCase().includes(q) ||
    (user.studentId?.toLowerCase().includes(q) ?? false)
  );
}

const MemberInvitePicker: React.FC<MemberInvitePickerProps> = ({
  users,
  selected,
  ownerId,
  onAdd,
  onRemove,
  placeholder = strings.modal.memberSearchPlaceholder,
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedIds = useMemo(() => new Set(selected.map(m => m.id)), [selected]);

  const suggestions = useMemo(() => {
    const pool = users.filter(u => !selectedIds.has(u.id));
    return pool
      .filter(u => matchesMemberQuery(u, query))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, MAX_SUGGESTIONS);
  }, [users, selectedIds, query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAdd = (user: User) => {
    onAdd(user);
    setQuery('');
    setOpen(false);
  };

  const showDropdown = open && suggestions.length > 0;
  const showEmpty = open && query.trim().length > 0 && suggestions.length === 0;

  return (
    <div className="member-invite-picker" ref={containerRef}>
      {selected.length > 0 && (
        <div className="member-invite-chips">
          {selected.map(member => (
            <span key={member.id} className="member-invite-chip">
              <span className="member-invite-chip-avatar">{member.name.charAt(0)}</span>
              <span className="member-invite-chip-text">
                {member.name}
                {member.studentId && (
                  <span className="member-invite-chip-sid">{member.studentId}</span>
                )}
              </span>
              {member.id === ownerId ? (
                <span className="member-invite-chip-badge">{strings.modal.memberOwner}</span>
              ) : (
                <button
                  type="button"
                  className="member-invite-chip-remove"
                  onClick={() => onRemove(member.id)}
                  aria-label={`Remove ${member.name}`}
                >
                  <X size={11} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      <div className="user-search">
        <div className="user-search-input-wrap">
          <Search size={13} className="user-search-icon" />
          <input
            type="text"
            className="user-search-input"
            value={query}
            placeholder={placeholder}
            autoComplete="off"
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
          />
          {query && (
            <button
              type="button"
              className="user-search-clear"
              onClick={() => { setQuery(''); setOpen(true); }}
              aria-label="Clear search"
            >
              <X size={11} />
            </button>
          )}
        </div>

        {showDropdown && (
          <div className="user-search-dropdown">
            {suggestions.map(user => (
              <button
                key={user.id}
                type="button"
                className="member-invite-suggestion"
                onClick={() => handleAdd(user)}
              >
                <span className="user-search-avatar">{user.name.charAt(0).toUpperCase()}</span>
                <span className="user-search-info">
                  <span className="user-search-name">{user.name}</span>
                  <span className="user-search-meta">
                    {user.studentId ?? user.email}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}

        {showEmpty && (
          <div className="user-search-dropdown">
            <div className="user-search-status">{strings.modal.noMembersFound}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberInvitePicker;
 