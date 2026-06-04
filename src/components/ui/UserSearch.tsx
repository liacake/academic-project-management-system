import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, UserRound } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { profilePath } from '../../lib/profilePaths';
import { visibleStudentId } from '../../lib/profileDisplay';
import { User } from '../../types';
import strings from './strings';
import './UserSearch.css';

interface UserSearchProps {
  placeholder?: string;
  excludeIds?: string[];
  onSelect: (user: User) => void;
  roleFilter?: User['role'][];
}

const UserSearch: React.FC<UserSearchProps> = ({ placeholder = 'Search by name, email or student ID…', excludeIds = [], onSelect, roleFilter }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 1) { setResults([]); return; }
    setLoading(true);
    let queryBuilder = supabase
      .from('profiles')
      .select('id, name, email, role, student_id, avatar')
      .or(`name.ilike.%${q}%,email.ilike.%${q}%,student_id.ilike.%${q}%`)
      .limit(8);

    if (roleFilter && roleFilter.length > 0)
      queryBuilder = queryBuilder.in('role', roleFilter);

    const { data } = await queryBuilder;
    const mapped: User[] = (data ?? [])
      .filter((u: Record<string, unknown>) => !excludeIds.includes(u.id as string))
      .map((u: Record<string, unknown>) => {
        const role = u.role as User['role'];
        return {
          id: u.id as string, name: u.name as string, email: u.email as string,
          role,
          studentId: visibleStudentId(role, u.student_id as string | null | undefined),
          avatar: (u.avatar ?? undefined) as string | undefined,
        };
      });
    setResults(mapped);
    setLoading(false);
  }, [excludeIds, roleFilter]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (user: User) => {
    onSelect(user);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const openProfile = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    setQuery('');
    setResults([]);
    navigate(profilePath(user.id));
  };

  const roleColor: Record<string, string> = {
    student: 'var(--accent)', coordinator: '#7c3aed', admin: '#dc2626', guest: 'var(--text-muted)',
  };

  return (
    <div className="user-search" ref={containerRef}>
      <div className="user-search-input-wrap">
        <Search size={13} className="user-search-icon" />
        <input
          ref={inputRef}
          className="user-search-input"
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {query && (
          <button className="user-search-clear" onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}>
            <X size={11} />
          </button>
        )}
      </div>
      {open && (query.length > 0) && (
        <div className="user-search-dropdown">
          {loading && <div className="user-search-status">Searching…</div>}
          {!loading && results.length === 0 && <div className="user-search-status">No users found</div>}
          {!loading && results.map(user => (
            <div key={user.id} className="user-search-result">
              <button type="button" className="user-search-result-main" onClick={() => handleSelect(user)}>
                <div className="user-search-avatar" style={{ background: roleColor[user.role] }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="user-search-info">
                  <span className="user-search-name">{user.name}</span>
                  <span className="user-search-meta">{user.email}{user.studentId ? ` · ${user.studentId}` : ''}</span>
                </div>
                <span className="user-search-role" style={{ color: roleColor[user.role] }}>{user.role}</span>
              </button>
              <button
                type="button"
                className="user-search-profile-btn"
                title={strings.profile.viewProfile}
                onClick={e => openProfile(user, e)}
              >
                <UserRound size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSearch;
