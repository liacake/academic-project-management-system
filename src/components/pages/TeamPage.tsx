import { useProjects } from '../../context/ProjectContext';
import { useTeam } from '../../context/TeamContext';
import Badge from '../ui/Badge';
import strings from '../ui/strings';
import './TeamPage.css';

const roleVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  student: 'default', coordinator: 'success', admin: 'danger', guest: 'neutral',
};

const TeamPage: React.FC = () => {
  const { projects } = useProjects();
  const { users, loading } = useTeam();

  const usersWithProjects = users.map(user => ({
    ...user,
    projects: projects.filter(p => p.members.some(m => m.id === user.id) || p.ownerId === user.id),
  }));

  if (loading) return <div className="team-page"><p>Loading team…</p></div>;

  return (
    <div className="team-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{strings.navbar.team}</h1>
          <p className="page-subtitle">{users.length} members in the system</p>
        </div>
      </div>

      <div className="team-grid">
        {usersWithProjects.map(user => (
          <div key={user.id} className="team-card">
            <div className="team-card-top">
              <div className="team-avatar">{user.name.charAt(0)}</div>
              <div className="team-info">
                <h3 className="team-name">{user.name}</h3>
                <p className="team-email">{user.email}</p>
              </div>
              <Badge label={strings.roles[user.role]} variant={roleVariant[user.role]} size="md" />
            </div>

            {user.studentId && (
              <div className="team-student-id">
                <span className="team-label">Student ID</span>
                <span className="team-value mono">{user.studentId}</span>
              </div>
            )}

            <div className="team-projects-section">
              <span className="team-label">Projects ({user.projects.length})</span>
              {user.projects.length > 0 ? (
                <div className="team-projects-list">
                  {user.projects.map(p => (
                    <div key={p.id} className="team-project-chip">
                      <span className={`team-project-dot dot--${p.status}`} />
                      <span>{p.title}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="team-no-projects">No projects yet</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamPage;
