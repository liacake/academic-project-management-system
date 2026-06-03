import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Crown, UserPlus, ExternalLink } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { useTeam } from '../../context/TeamContext';
import { canModifyProject, canViewAllProjects } from '../../lib/permissions';
import { pickDefaultProjectId, setLastViewedProjectId } from '../../lib/lastViewedProject';
import { Project, User } from '../../types';
import Badge from '../ui/Badge';
import UserLink from '../ui/UserLink';
import UserSearch from '../ui/UserSearch';
import strings from '../ui/strings';
import './TeamPage.css';

const roleVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  student: 'default', coordinator: 'success', admin: 'danger', guest: 'neutral',
};

const statusVariant: Record<string, 'success' | 'default' | 'neutral' | 'warning'> = {
  active: 'success', planning: 'warning', completed: 'default', archived: 'neutral',
};

function matchesQuery(project: Project, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    project.title.toLowerCase().includes(q) ||
    project.description.toLowerCase().includes(q) ||
    project.technologies.some(t => t.name.toLowerCase().includes(q))
  );
}

function isInvolvedInProject(project: Project, userId: string): boolean {
  return (
    project.ownerId === userId ||
    project.coordinatorId === userId ||
    project.members.some(m => m.id === userId)
  );
}

interface DisplayMember {
  user: User;
  label?: string;
}

function buildMemberList(project: Project, users: User[]): DisplayMember[] {
  const seen = new Set<string>();
  const list: DisplayMember[] = [];

  const add = (user: User | undefined, label?: string) => {
    if (!user || seen.has(user.id)) return;
    seen.add(user.id);
    list.push({ user, label });
  };

  if (project.coordinator) add(project.coordinator, strings.team.coordinator);
  const owner = users.find(u => u.id === project.ownerId);
  add(owner, strings.team.owner);
  for (const member of project.members) add(member);

  return list;
}

const TeamPage: React.FC = () => {
  const navigate = useNavigate();
  const { projects, loading: projectsLoading, fetchProject, addMember, removeMember } = useProjects();
  const { user } = useAuth();
  const { users, loading: teamLoading } = useTeam();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [search, setSearch] = useState('');
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [addingMemberId, setAddingMemberId] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const canViewAllTeams = canViewAllProjects(user?.role);

  const baseProjects = useMemo(() => {
    if (!user) return [];
    return canViewAllTeams ? projects : projects.filter(p => isInvolvedInProject(p, user.id));
  }, [projects, user, canViewAllTeams]);

  const recentProjects = useMemo(
    () => [...baseProjects]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5),
    [baseProjects]
  );

  const searchSuggestions = useMemo(() => {
    const q = search.trim();
    if (!q) return [];
    return baseProjects.filter(p => matchesQuery(p, q)).slice(0, 8);
  }, [baseProjects, search]);

  useEffect(() => {
    if (!user || baseProjects.length === 0) return;

    setSelectedProjectId(prev => {
      if (prev && baseProjects.some(p => p.id === prev)) return prev;
      return pickDefaultProjectId({
        userId: user.id,
        accessibleIds: baseProjects.map(p => p.id),
        fallbackId: recentProjects[0]?.id,
      });
    });
  }, [baseProjects, recentProjects, user]);

  useEffect(() => {
    if (selectedProjectId) fetchProject(selectedProjectId);
  }, [selectedProjectId, fetchProject]);

  useEffect(() => {
    if (selectedProjectId) setLastViewedProjectId(user?.id, selectedProjectId);
  }, [selectedProjectId, user?.id]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const canManage = selectedProject ? canModifyProject(user, selectedProject) : false;
  const displayMembers = selectedProject ? buildMemberList(selectedProject, users) : [];

  const memberIds = useMemo(() => {
    if (!selectedProject) return [];
    const ids = selectedProject.members.map(m => m.id);
    if (selectedProject.coordinator) ids.push(selectedProject.coordinator.id);
    if (selectedProject.ownerId) ids.push(selectedProject.ownerId);
    return ids;
  }, [selectedProject]);

  const selectProject = (id: string) => {
    setSelectedProjectId(id);
    setSearch('');
    setSuggestionsOpen(false);
    setShowAddMember(false);
  };

  const handleAddMember = async (selectedUser: User) => {
    if (!selectedProject) return;
    setAddingMemberId(selectedUser.id);
    await addMember(selectedProject.id, selectedUser.id);
    setAddingMemberId(null);
    setShowAddMember(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedProject || !window.confirm(strings.team.confirmRemove)) return;
    await removeMember(selectedProject.id, memberId);
  };

  const loading = projectsLoading || teamLoading;

  if (loading) {
    return <div className="team-page"><p className="team-muted">{strings.team.loading}</p></div>;
  }

  return (
    <div className="team-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{strings.navbar.team}</h1>
          <p className="page-subtitle">{strings.team.subtitle}</p>
        </div>
      </div>

      {baseProjects.length > 0 && (
        <div className="team-recent">
          <span className="team-recent-label">{strings.team.recentProjects}</span>
          <div className="team-chips">
            {recentProjects.map(p => (
              <button
                key={p.id}
                type="button"
                className={`team-chip ${selectedProjectId === p.id ? 'team-chip--active' : ''}`}
                onClick={() => selectProject(p.id)}
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="team-search-block" ref={searchRef}>
        <div className="team-search-wrapper">
          <Search size={15} className="team-search-icon" />
          <input
            type="text"
            className="team-search-input"
            placeholder={strings.team.searchProjects}
            value={search}
            onChange={e => { setSearch(e.target.value); setSuggestionsOpen(true); }}
            onFocus={() => setSuggestionsOpen(true)}
          />
          {search && (
            <button
              type="button"
              className="team-search-clear"
              onClick={() => { setSearch(''); setSuggestionsOpen(false); }}
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {suggestionsOpen && search.trim() && (
          <div className="team-suggestions">
            {searchSuggestions.length === 0 ? (
              <div className="team-suggestion-empty">{strings.team.noMatch}</div>
            ) : (
              searchSuggestions.map(p => (
                <button
                  key={p.id}
                  type="button"
                  className={`team-suggestion ${selectedProjectId === p.id ? 'team-suggestion--active' : ''}`}
                  onClick={() => selectProject(p.id)}
                >
                  <span className="team-suggestion-title">{p.title}</span>
                  <Badge label={strings.projects.status[p.status]} variant={statusVariant[p.status]} />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {baseProjects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>{strings.team.noProjects}</h3>
          <p>{strings.team.noProjectsHint}</p>
        </div>
      ) : !selectedProject ? (
        <div className="empty-state">
          <p>{strings.team.selectHint}</p>
        </div>
      ) : (
        <div className="team-panel">
          <div className="team-panel-header">
            <div className="team-panel-title-wrap">
              <h2 className="team-project-title">{selectedProject.title}</h2>
              <div className="team-panel-meta">
                <Badge label={strings.projects.status[selectedProject.status]} variant={statusVariant[selectedProject.status]} />
                <span>
                  {displayMembers.length} {displayMembers.length === 1 ? strings.team.member : strings.team.members}
                </span>
              </div>
            </div>
            <div className="team-panel-actions">
              <button type="button" className="btn-secondary" onClick={() => navigate(`/projects/${selectedProject.id}`)}>
                <ExternalLink size={14} /> {strings.team.viewProject}
              </button>
              {canManage && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setShowAddMember(v => !v)}
                >
                  <UserPlus size={14} /> {strings.team.addMember}
                </button>
              )}
            </div>
          </div>

          {!canManage && (
            <p className="team-readonly-hint">{strings.team.readonlyHint}</p>
          )}

          {showAddMember && canManage && (
            <div className="team-add-panel">
              <p className="team-add-hint">{strings.team.addMemberHint}</p>
              <UserSearch
                placeholder={strings.team.searchUsers}
                excludeIds={memberIds}
                onSelect={handleAddMember}
              />
              {addingMemberId && <p className="team-add-hint">{strings.team.addingMember}</p>}
            </div>
          )}

          <div className="team-member-list">
            {displayMembers.map(({ user: member, label }) => {
              const isOwner = member.id === selectedProject.ownerId;
              const isCoordinator = label === strings.team.coordinator;
              const inMembersTable = selectedProject.members.some(m => m.id === member.id);
              const removable = canManage && inMembersTable && !isOwner;

              return (
                <div key={member.id} className="team-member-row">
                  <UserLink userId={member.id} className="team-member-link">
                    <div className={`team-avatar ${isCoordinator ? 'team-avatar--coord' : ''}`}>
                      {member.name.charAt(0)}
                    </div>
                    <div className="team-member-info">
                      <span className="team-member-name">{member.name}</span>
                      <span className="team-member-email">{member.email}</span>
                    </div>
                  </UserLink>

                  <div className="team-member-badges">
                    {isCoordinator && <Crown size={14} className="team-coord-icon" aria-hidden />}
                    {label && <span className="team-role-pill">{label}</span>}
                    <Badge label={strings.roles[member.role]} variant={roleVariant[member.role]} size="md" />
                  </div>

                  {member.studentId && (
                    <span className="team-member-sid mono">{member.studentId}</span>
                  )}

                  {removable ? (
                    <button
                      type="button"
                      className="team-remove-btn"
                      title={strings.team.removeMember}
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <X size={12} />
                    </button>
                  ) : (
                    <span className="team-remove-spacer" aria-hidden />
                  )}
                </div>
              );
            })}
          </div>

          {displayMembers.length === 0 && (
            <p className="team-muted">{strings.team.emptyTeam}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamPage;
