import { useMemo, useState } from 'react';
import { Search, X, Trash2 } from 'lucide-react';
import { useTeam } from '../../context/TeamContext';
import { useAuth } from '../../context/AuthContext';
import { canDeleteUserAccount } from '../../lib/permissions';
import { Role, User } from '../../types';
import Badge from '../ui/Badge';
import UserLink from '../ui/UserLink';
import strings from '../ui/strings';
import './AdminPage.css';

const ROLES: Role[] = ['student', 'coordinator', 'admin', 'guest'];

const roleVariant: Record<Role, 'default' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  student: 'default',
  coordinator: 'success',
  admin: 'danger',
  guest: 'neutral',
};

const AdminPage: React.FC = () => {
  const { users, loading, updateUserRole, deleteUserAccount } = useTeam();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(u => {
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchSearch = !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.studentId?.toLowerCase().includes(q) ?? false);
      return matchRole && matchSearch;
    });
  }, [users, search, roleFilter]);

  const handleRoleChange = async (userId: string, role: Role) => {
    setSavingId(userId);
    setError('');
    const result = await updateUserRole(userId, role);
    setSavingId(null);
    if (!result.success) setError(result.error ?? strings.admin.roleUpdateError);
  };

  const handleDeleteAccount = async (target: User) => {
    const msg = strings.admin.confirmDeleteAccount
      .replace('{name}', target.name)
      .replace('{email}', target.email);
    if (!window.confirm(msg)) return;
    setDeletingId(target.id);
    setError('');
    const result = await deleteUserAccount(target.id);
    setDeletingId(null);
    if (!result.success) setError(result.error ?? strings.admin.deleteAccountError);
  };

  if (loading) {
    return <div className="admin-page"><p className="admin-loading">{strings.admin.loading}</p></div>;
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{strings.admin.title}</h1>
          <p className="page-subtitle">{strings.admin.subtitle}</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <Search size={15} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder={strings.admin.searchPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="admin-search-clear" onClick={() => setSearch('')} aria-label="Clear search">
              <X size={13} />
            </button>
          )}
        </div>
        <select
          className="filter-select"
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value as Role | 'all')}
        >
          <option value="all">{strings.admin.allRoles}</option>
          {ROLES.map(role => (
            <option key={role} value={role}>{strings.roles[role]}</option>
          ))}
        </select>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <colgroup>
            <col className="admin-col-name" />
            <col className="admin-col-email" />
            <col className="admin-col-sid" />
            <col className="admin-col-role" />
            <col className="admin-col-actions" />
          </colgroup>
          <thead>
            <tr>
              <th>{strings.admin.colName}</th>
              <th>{strings.admin.colEmail}</th>
              <th>{strings.admin.colStudentId}</th>
              <th>{strings.admin.colRole}</th>
              <th>{strings.admin.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="admin-empty">{strings.admin.noUsers}</td>
              </tr>
            ) : (
              filtered.map(u => (
                <tr key={u.id} className={u.id === currentUser?.id ? 'admin-row--self' : ''}>
                  <td>
                    <div className="admin-user-cell">
                      <UserLink userId={u.id} className="admin-user-link">
                        <div className="admin-avatar">{u.name.charAt(0)}</div>
                        <span>{u.name}</span>
                      </UserLink>
                      {u.id === currentUser?.id && (
                        <span className="admin-you-badge">{strings.admin.you}</span>
                      )}
                    </div>
                  </td>
                  <td className="admin-email">
                    <span className="admin-cell-clip" title={u.email}>{u.email}</span>
                  </td>
                  <td className="admin-mono admin-sid-cell">{u.studentId ?? '—'}</td>
                  <td className="admin-role-td">
                    <div className="admin-role-cell">
                      <span className="admin-role-badge-wrap">
                        <Badge label={strings.roles[u.role]} variant={roleVariant[u.role]} size="md" />
                      </span>
                      <select
                        className="admin-role-select"
                        value={u.role}
                        disabled={savingId === u.id}
                        onChange={e => handleRoleChange(u.id, e.target.value as Role)}
                        aria-label={`${strings.admin.changeRole} ${u.name}`}
                      >
                        {ROLES.map(role => (
                          <option key={role} value={role}>{strings.roles[role]}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="admin-actions-cell">
                    {canDeleteUserAccount(currentUser, u) ? (
                      <button
                        type="button"
                        className="admin-delete-btn"
                        title={strings.admin.deleteAccount}
                        disabled={deletingId === u.id || savingId === u.id}
                        onClick={() => handleDeleteAccount(u)}
                      >
                        <Trash2 size={14} />
                        <span>{deletingId === u.id ? '…' : strings.admin.deleteAccount}</span>
                      </button>
                    ) : (
                      <span className="admin-actions-muted">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="admin-hint">{strings.admin.hint}</p>
    </div>
  );
};

export default AdminPage;
