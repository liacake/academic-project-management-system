import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Kanban, Github, ExternalLink, Check, UserPlus, Crown, X, Pencil, Trash2 } from 'lucide-react';
import EditProjectModal from '../modals/EditProjectModal';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { canModifyProject, canDeleteProject } from '../../lib/permissions';
import { useInvites } from '../../context/InviteContext';
import Badge from '../ui/Badge';
import UserSearch from '../ui/UserSearch';
import strings from '../ui/strings';
import '../modals/Modal.css';
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
  const { projects, selectedProject, fetchProject, loading, addMember, removeMember, deleteProject } = useProjects();
  const { user } = useAuth();
  const { sendInvite } = useInvites();
  const navigate = useNavigate();

  const [showAddMember, setShowAddMember] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showInviteCoord, setShowInviteCoord] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [addingMemberId, setAddingMemberId] = useState<string | null>(null);

  useEffect(() => { if (id) fetchProject(id); }, [id, fetchProject]);

  const project = selectedProject?.id === id ? selectedProject : projects.find(p => p.id === id);

  if (loading && !project) return <div className="not-found"><p>Loading project…</p></div>;
  if (!project) return (
    <div className="not-found">
      <h2>Project not found</h2>
      <button className="btn-primary" onClick={() => navigate('/projects')}>← Back</button>
    </div>
  );

  const completedTasks = project.tasks.filter(t => t.status === 'done').length;
  const progress = project.tasks.length > 0 ? Math.round((completedTasks / project.tasks.length) * 100) : 0;

  const canManage = canModifyProject(user, project);
  const canDelete = canDeleteProject(user, project);

  const handleDelete = async () => {
    setDeleting(true);
    await deleteProject(project.id);
    setDeleting(false);
    navigate('/projects');
  };

  const handleAddMember = async (selectedUser: { id: string }) => {
    setAddingMemberId(selectedUser.id);
    await addMember(project.id, selectedUser.id);
    setAddingMemberId(null);
    setShowAddMember(false);
  };

  const handleInviteCoordinator = async (selectedUser: { id: string }) => {
    await sendInvite(project.id, selectedUser.id);
    setInviteSent(true);
    setShowInviteCoord(false);
    setTimeout(() => setInviteSent(false), 3000);
  };

  const memberIds = project.members.map(m => m.id);
  if (project.coordinator) memberIds.push(project.coordinator.id);

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
            {project.coordinator && (
              <span className="detail-coord-badge">
                <Crown size={10} /> {project.coordinator.name}
              </span>
            )}
            {!project.coordinator && (
              <span className="detail-coord-badge detail-coord-badge--none">No coordinator</span>
            )}
            {project.semester && project.year && (
              <span className="detail-semester">{project.semester} {project.year}</span>
            )}
          </div>
          <h1 className="detail-title">{project.title}</h1>
          <p className="detail-desc">{project.description}</p>
        </div>

        <div className="detail-actions">
          {canManage && (
            <button type="button" className="btn-secondary" onClick={() => setShowEdit(true)}>
              <Pencil size={14} /> Edit
            </button>
          )}
          {canDelete && (
            <button type="button" className="btn-danger" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 size={14} /> {strings.projects.deleteProject}
            </button>
          )}
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
          {/* Technologies */}
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

          {/* Tasks */}
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

          {/* Invite success flash */}
          {inviteSent && (
            <div className="invite-flash">Coordinator invitation sent!</div>
          )}

          {/* Coordinator card */}
          <div className="sidebar-card">
            <div className="sidebar-card-header">
              <h4 className="sidebar-card-title">Coordinator</h4>
              {canManage && !project.coordinatorId && (
                <button className="sidebar-icon-btn" onClick={() => setShowInviteCoord(v => !v)} title="Invite coordinator">
                  <Crown size={13} />
                </button>
              )}
            </div>

            {showInviteCoord && (
              <div className="sidebar-search-panel">
                <p className="sidebar-search-hint">Invite a coordinator — they'll get a notification to accept.</p>
                <UserSearch
                  placeholder="Search coordinators…"
                  roleFilter={['coordinator', 'admin']}
                  excludeIds={memberIds}
                  onSelect={handleInviteCoordinator}
                />
              </div>
            )}

            {project.coordinator ? (
              <div className="member-row">
                <div className="member-row-avatar coord-avatar">{project.coordinator.name.charAt(0)}</div>
                <div className="member-row-info">
                  <span className="member-row-name">{project.coordinator.name}</span>
                  <span className="member-row-role">{project.coordinator.email}</span>
                </div>
                <Crown size={12} style={{ color: '#7c3aed', flexShrink: 0 }} />
              </div>
            ) : (
              <p className="sidebar-empty-hint">
                {!project.coordinatorId
                  ? 'No coordinator assigned. All members can manage this project.'
                  : 'Invitation pending acceptance.'}
              </p>
            )}
          </div>

          {/* Team members card */}
          <div className="sidebar-card">
            <div className="sidebar-card-header">
              <h4 className="sidebar-card-title">Team Members</h4>
              {canManage && (
                <button className="sidebar-icon-btn" onClick={() => setShowAddMember(v => !v)} title="Add member">
                  <UserPlus size={13} />
                </button>
              )}
            </div>

            {showAddMember && (
              <div className="sidebar-search-panel">
                <UserSearch
                  placeholder="Search by name, email or student ID…"
                  excludeIds={memberIds}
                  onSelect={handleAddMember}
                />
                {addingMemberId && <p className="sidebar-search-hint">Adding…</p>}
              </div>
            )}

            <div className="members-list">
              {project.members.map(member => (
                <div key={member.id} className="member-row">
                  <div className="member-row-avatar">{member.name.charAt(0)}</div>
                  <div className="member-row-info">
                    <span className="member-row-name">{member.name}</span>
                    <span className="member-row-role">{strings.roles[member.role]}</span>
                  </div>
                  {member.studentId && <span className="member-id">{member.studentId}</span>}
                  {canManage && member.id !== project.ownerId && (
                    <button className="member-remove-btn" title="Remove member" onClick={() => removeMember(project.id, member.id)}>
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}
              {project.members.length === 0 && (
                <p className="sidebar-empty-hint">No members yet.</p>
              )}
            </div>
          </div>

          {/* Project info card */}
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
      {showEdit && <EditProjectModal project={project} onClose={() => setShowEdit(false)} />}

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !deleting) setShowDeleteConfirm(false); }}>
          <div className="modal modal--confirm" role="dialog" aria-labelledby="delete-project-title">
            <div className="modal-header">
              <h2 id="delete-project-title">{strings.projects.deleteProject}</h2>
              <button type="button" className="modal-close" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                <X size={14} />
              </button>
            </div>
            <p className="modal-confirm-text">{strings.projects.confirmDelete}</p>
            <p className="modal-confirm-name"><strong>{project.title}</strong></p>
            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                {strings.modal.cancel}
              </button>
              <button type="button" className="btn-danger btn-danger--solid" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : strings.projects.deleteProject}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage;
