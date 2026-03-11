import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Kanban, Github, ExternalLink, Check } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import Badge from '../ui/Badge';
import strings from '../ui/strings';
import './ProjectDetailPage.css';

const statusVariant: Record<string, 'success' | 'default' | 'neutral' | 'warning'> = {
  active: 'success', planning: 'warning', completed: 'default', archived: 'neutral',
};
const taskStatusVariant: Record<string, 'default' | 'info' | 'warning' | 'success'> = {
  todo: 'default', 'in-progress': 'info', review: 'warning', done: 'success',
};
const priorityVariant: Record<string, 'danger' | 'warning' | 'neutral'> = {
  high: 'danger', medium: 'warning', low: 'neutral',
};

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { projects, selectedProject, fetchProject, loading } = useProjects();
  const navigate = useNavigate();

  // Load full project (with tasks) when page mounts
  useEffect(() => {
    if (id) fetchProject(id);
  }, [id, fetchProject]);

  const project = selectedProject?.id === id ? selectedProject : projects.find(p => p.id === id);

  if (loading && !project) {
    return <div className="not-found"><p>Loading project…</p></div>;
  }

  if (!project) {
    return (
      <div className="not-found">
        <h2>Project not found</h2>
        <button className="btn-primary" onClick={() => navigate('/projects')}>← Back</button>
      </div>
    );
  }

  const completedTasks = project.tasks.filter(t => t.status === 'done').length;
  const progress = project.tasks.length > 0 ? Math.round((completedTasks / project.tasks.length) * 100) : 0;

  return (
    <div className="project-detail">
      <div className="detail-breadcrumb">
        <button className="btn-back" onClick={() => navigate('/projects')}>
          <ChevronLeft size={14} style={{ display:'inline', verticalAlign:'middle' }} /> Projects
        </button>
        <span>/</span>
        <span>{project.title}</span>
      </div>

      <div className="detail-header">
        <div className="detail-header-left">
          <div className="detail-meta">
            <Badge label={strings.projects.status[project.status]} variant={statusVariant[project.status]} size="md" />
            <Badge label={project.isPublic ? strings.projects.public : strings.projects.private} variant="neutral" size="md" />
            {project.semester && project.year && (
              <span className="detail-semester">{project.semester} {project.year}</span>
            )}
          </div>
          <h1 className="detail-title">{project.title}</h1>
          <p className="detail-desc">{project.description}</p>
        </div>

        <div className="detail-actions">
          <button className="btn-secondary" onClick={() => navigate('/kanban', { state: { projectId: project.id } })}>
            <Kanban size={14} /> Kanban
          </button>
          {project.repositoryUrl && (
            <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              <Github size={14} /> Repository
            </a>
          )}
          {project.demoUrl && (
            <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              <ExternalLink size={14} /> Live Demo
            </a>
          )}
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-main">
          <div className="detail-section">
            <h3 className="detail-section-title">Technologies</h3>
            <div className="tech-grid">
              {project.technologies.map(tech => (
                <div key={tech.id} className="tech-chip" style={{ borderColor: `${tech.color}44` }}>
                  <span className="tech-dot" style={{ background: tech.color }} />
                  <span className="tech-name">{tech.name}</span>
                  <span className="tech-category">{tech.category}</span>
                </div>
              ))}
            </div>
          </div>

          {project.tasks.length > 0 && (
            <div className="detail-section">
              <div className="section-header-inline">
                <h3 className="detail-section-title">Tasks</h3>
                <span className="task-summary">{completedTasks}/{project.tasks.length} done · {progress}%</span>
              </div>
              <div className="tasks-progress-bar">
                <div className="tasks-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="tasks-list">
                {project.tasks.map(task => {
                  const assignee = project.members.find(m => m.id === task.assigneeId);
                  return (
                    <div key={task.id} className={`task-row ${task.status === 'done' ? 'task-row--done' : ''}`}>
                      <div className="task-row-left">
                        <div className={`task-check ${task.status === 'done' ? 'checked' : ''}`}>
                          {task.status === 'done' && <Check size={10} />}
                        </div>
                        <div className="task-row-info">
                          <span className="task-row-title">{task.title}</span>
                          {task.description && <span className="task-row-desc">{task.description}</span>}
                        </div>
                      </div>
                      <div className="task-row-right">
                        {assignee && <div className="task-assignee" title={assignee.name}>{assignee.name.charAt(0)}</div>}
                        <Badge label={strings.kanban.columns[task.status]} variant={taskStatusVariant[task.status]} />
                        <Badge label={strings.kanban.priority[task.priority]} variant={priorityVariant[task.priority]} />
                        {task.dueDate && (
                          <span className="task-due">
                            due {new Date(task.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <aside className="detail-sidebar">
          <div className="sidebar-card">
            <h4 className="sidebar-card-title">Team Members</h4>
            <div className="members-list">
              {project.members.map(member => (
                <div key={member.id} className="member-row">
                  <div className="member-row-avatar">{member.name.charAt(0)}</div>
                  <div className="member-row-info">
                    <span className="member-row-name">{member.name}</span>
                    <span className="member-row-role">{strings.roles[member.role]}</span>
                  </div>
                  {member.studentId && <span className="member-id">{member.studentId}</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-card">
            <h4 className="sidebar-card-title">Project Info</h4>
            <div className="info-list">
              {[
                ['Created', new Date(project.createdAt).toLocaleDateString('en', { year:'numeric', month:'short', day:'numeric' })],
                ['Updated', new Date(project.updatedAt).toLocaleDateString('en', { year:'numeric', month:'short', day:'numeric' })],
                ...(project.semester ? [['Semester', `${project.semester} ${project.year}`]] : []),
                ['Visibility', project.isPublic ? 'Public' : 'Private'],
                ['Members', String(project.members.length)],
                ['Technologies', String(project.technologies.length)],
              ].map(([label, value]) => (
                <div key={label} className="info-row">
                  <span className="info-label">{label}</span>
                  <span className="info-value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
