import { useState, useEffect, useMemo } from 'react';
import { Search, X, Crown } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { useTeam } from '../../context/TeamContext';
import { Project, User } from '../../types';
import Badge from '../ui/Badge';
import strings from '../ui/strings';
import './TeamPage.css';

const roleVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  student: 'default', coordinator: 'success', admin: 'danger', guest: 'neutral',
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

function isProjectMember(project: Project, userId: string): boolean {
  return project.members.some(m => m.id === userId);
}

function isInvolvedInProject(project: Project, userId: string): boolean {
  return (
    project.ownerId === userId ||
    project.coordinatorId === userId ||
    isProjectMember(project, userId)
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
  const { projects, loading: projectsLoading } = useProjects();
  const { user } = useAuth();
  const { users, loading: teamLoading } = useTeam();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [search, setSearch] = useState('');

  const involvedProjects = useMemo(
    () => (user ? projects.filter(p => isInvolvedInProject(p, user.id)) : []),
    [projects, user]
  );

  const dropdownProjects = useMemo(
    () => involvedProjects.filter(p => matchesQuery(p, search)),
    [involvedProjects, search]
  );

  const searchableProjects = useMemo(
    () => projects.filter(p => matchesQuery(p, search)),
    [projects, search]
  );

  const selectOptions = search.trim() ? searchableProjects : dropdownProjects;

  useEffect(() => {
    if (!selectedProjectId && involvedProjects.length > 0) {
      setSelectedProjectId(involvedProjects[0].id);
    }
  }, [involvedProjects, selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId && !selectOptions.some(p => p.id === selectedProjectId)) {
      setSelectedProjectId(selectOptions[0]?.id ?? '');
    }
  }, [selectOptions, selectedProjectId]);

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const displayMembers = selectedProject ? buildMemberList(selectedProject, users) : [];

  const loading = projectsLoading || teamLoading;

  if (loading) return <div className="team-page"><p>Loading team…</p></div>;

  return (
    <div className="team-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{strings.navbar.team}</h1>
          <p className="page-subtitle">{strings.team.subtitle}</p>
        </div>
      </div>

      <div className="team-toolbar">
        <div className="team-search-wrapper">
          <Search size={15} className="team-search-icon" />
          <input
            type="text"
            className="team-search-input"
            placeholder={strings.team.searchProjects}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="team-search-clear" onClick={() => setSearch('')} aria-label="Clear search">
              <X size={13} />
            </button>
          )}
        </div>

        <select
          className="filter-select team-project-select"
          value={selectedProjectId}
          onChange={e => setSelectedProjectId(e.target.value)}
          disabled={selectOptions.length === 0}
        >
          <option value="">{strings.team.selectProject}</option>
          {selectOptions.map(p => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      </div>

      {involvedProjects.length === 0 && !search.trim() ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>{strings.team.noProjects}</h3>
          <p>{strings.team.noProjectsHint}</p>
        </div>
      ) : selectOptions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>{strings.team.noMatch}</h3>
        </div>
      ) : !selectedProject ? (
        <div className="empty-state">
          <p>{strings.team.selectHint}</p>
        </div>
      ) : (
        <>
          <div className="team-project-header">
            <h2 className="team-project-title">{selectedProject.title}</h2>
            <p className="team-project-meta">
              {displayMembers.length} {displayMembers.length === 1 ? strings.team.member : strings.team.members}
            </p>
          </div>

          <div className="team-grid">
            {displayMembers.map(({ user: member, label }) => (
              <div key={member.id} className="team-card">
                <div className="team-card-top">
                  <div className="team-avatar">{member.name.charAt(0)}</div>
                  <div className="team-info">
                    <h3 className="team-name">{member.name}</h3>
                    <p className="team-email">{member.email}</p>
                  </div>
                  <div className="team-card-badges">
                    {label === strings.team.coordinator && (
                      <Crown size={14} className="team-coord-icon" aria-hidden />
                    )}
                    <Badge label={strings.roles[member.role]} variant={roleVariant[member.role]} size="md" />
                  </div>
                </div>

                {label && (
                  <div className="team-project-role">
                    <span className="team-label">{label}</span>
                  </div>
                )}

                {member.studentId && (
                  <div className="team-student-id">
                    <span className="team-label">Student ID</span>
                    <span className="team-value mono">{member.studentId}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TeamPage;
