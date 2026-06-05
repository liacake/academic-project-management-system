import { useNavigate } from 'react-router-dom';
import { FolderOpen, Play, Users, ListTodo, ArrowRight } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { useTeam } from '../../context/TeamContext';
import { canCreateProjects, canViewAllProjects } from '../../lib/permissions';
import { countAssignedOpenTasks } from '../../lib/userTasks';
import ProjectCard from '../ui/ProjectCard';
import Badge from '../ui/Badge';
import TechFilterChip from '../ui/TechFilterChip';
import { Technology } from '../../types';
import strings from '../ui/strings';
import './DashboardPage.css';

const DASHBOARD_RECENT_PROJECTS = 3;

const DashboardPage: React.FC = () => {
  const { projects } = useProjects();
  const { users } = useTeam();
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const showCreate = canCreateProjects(user?.role);
  const overviewMode = canViewAllProjects(user?.role);

  const activeProjects = projects.filter(p => p.status === 'active');
  const studentCount = users.filter(u => u.role === 'student').length;
  const myOpenTasks = user ? countAssignedOpenTasks(projects, user.id) : 0;
  const allTasks   = projects.flatMap(p => p.tasks);

  const tasksByStatus = {
    todo:          allTasks.filter(t => t.status === 'todo').length,
    'in-progress': allTasks.filter(t => t.status === 'in-progress').length,
    review:        allTasks.filter(t => t.status === 'review').length,
    done:          allTasks.filter(t => t.status === 'done').length,
  };

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, DASHBOARD_RECENT_PROJECTS);

  const techFrequency = projects.flatMap(p => p.technologies).reduce((acc, tech) => {
    acc[tech.name] = { count: (acc[tech.name]?.count || 0) + 1, tech };
    return acc;
  }, {} as Record<string, { count: number; tech: Technology }>);

  const topTechs = Object.values(techFrequency).sort((a, b) => b.count - a.count).slice(0, 8);

  const stats: {
    label: string;
    value: number;
    Icon: typeof FolderOpen;
    cls: string;
    onClick?: () => void;
  }[] = [
    {
      label: strings.dashboard.totalProjects,
      value: projects.length,
      Icon: FolderOpen,
      cls: 'blue',
      onClick: () => navigate('/projects'),
    },
    {
      label: strings.dashboard.activeProjects,
      value: activeProjects.length,
      Icon: Play,
      cls: 'green',
      onClick: () => navigate('/projects?status=active'),
    },
    {
      label: strings.dashboard.totalStudents,
      value: studentCount,
      Icon: Users,
      cls: 'purple',
      onClick: hasRole('admin') ? () => navigate('/admin') : undefined,
    },
    {
      label: strings.dashboard.myOpenTasks,
      value: myOpenTasks,
      Icon: ListTodo,
      cls: 'orange',
      onClick: () => navigate('/tasks'),
    },
  ];

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">{strings.dashboard.title}</h1>
          <p className="page-subtitle">
            {overviewMode
              ? strings.dashboard.subtitleOverview.replace('{n}', String(projects.length))
              : <>Welcome back, <strong>{user?.name}</strong></>}
          </p>
        </div>
        {showCreate && (
          <button className="btn-primary" onClick={() => navigate('/projects')}>
            + {strings.dashboard.newProject}
          </button>
        )}
      </div>

      <div className="stats-grid">
        {stats.map(({ label, value, Icon, cls, onClick }) =>
          onClick ? (
            <button
              key={label}
              type="button"
              className="stat-card stat-card--clickable"
              onClick={onClick}
            >
              <div className={`stat-icon stat-icon--${cls}`}><Icon size={18} /></div>
              <div className="stat-content">
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            </button>
          ) : (
            <div key={label} className="stat-card">
              <div className={`stat-icon stat-icon--${cls}`}><Icon size={18} /></div>
              <div className="stat-content">
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            </div>
          )
        )}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section dashboard-section--wide">
          <div className="section-header">
            <h2 className="section-title">{strings.dashboard.recentProjects}</h2>
            <button className="btn-link" onClick={() => navigate('/projects')}>
              {strings.dashboard.viewAll} <ArrowRight size={12} style={{ display:'inline', verticalAlign:'middle' }} />
            </button>
          </div>
          <div className="projects-grid">
            {recentProjects.map(project => (
              <ProjectCard key={project.id} project={project} onClick={() => navigate(`/projects/${project.id}`)} />
            ))}
          </div>
        </div>

        <div className="dashboard-sidebar">
          <div className="dashboard-section">
            <h2 className="section-title">{strings.dashboard.tasksByStatus}</h2>
            <div className="task-status-list">
              {Object.entries(tasksByStatus).map(([status, count]) => (
                <div key={status} className="task-status-item">
                  <div className={`task-status-dot dot--${status}`} />
                  <span className="task-status-name">
                    {strings.kanban.columns[status as keyof typeof strings.kanban.columns]}
                  </span>
                  <span className="task-status-count">{count}</span>
                  <div className="task-status-bar">
                    <div className={`task-status-fill fill--${status}`}
                      style={{ width: `${allTasks.length ? (count / allTasks.length) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-section">
            <h2 className="section-title">Top Technologies</h2>
            <div className="tech-list">
              {topTechs.map(({ tech, count }) => (
                <div key={tech.id} className="tech-item">
                  <TechFilterChip techId={tech.id} title={`Filter projects by ${tech.name}`}>
                    <Badge label={tech.name} color={tech.color} />
                  </TechFilterChip>
                  <span className="tech-count">{count} project{count !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
