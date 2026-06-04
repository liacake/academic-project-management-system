import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GripVertical, Plus, X } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { canModifyProject } from '../../lib/permissions';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { pickDefaultProjectId, setLastViewedProjectId } from '../../lib/lastViewedProject';
import { getAssignedTasks } from '../../lib/userTasks';
import { Project, TaskStatus, Task } from '../../types';
import Badge from '../ui/Badge';
import UserLink from '../ui/UserLink';
import TaskPanel from '../tasks/TaskPanel';
import strings from '../ui/strings';
import './KanbanPage.css';

const columns: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo',        label: strings.kanban.columns.todo,           color: 'var(--text-muted)' },
  { id: 'in-progress', label: strings.kanban.columns['in-progress'], color: '#0284c7' },
  { id: 'review',      label: strings.kanban.columns.review,         color: 'var(--warning)' },
  { id: 'done',        label: strings.kanban.columns.done,           color: 'var(--success)' },
];

const priorityVariant: Record<string, 'danger' | 'warning' | 'neutral'> = {
  high: 'danger', medium: 'warning', low: 'neutral',
};

interface TaskCardItem {
  task: Task;
  project: Project;
}

interface AddCardFormProps {
  projectId: string;
  status: TaskStatus;
  onClose: () => void;
}

const AddCardForm: React.FC<AddCardFormProps> = ({ projectId, status, onClose }) => {
  const { addTask } = useProjects();
  const [title, setTitle]       = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [saving, setSaving]     = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await addTask({ projectId, title: title.trim(), status, priority, description: undefined, assigneeId: undefined, dueDate: undefined });
    setSaving(false);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="add-card-form">
      <textarea
        ref={inputRef}
        className="add-card-input"
        placeholder={strings.kanban.taskTitlePlaceholder}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
      />
      <div className="add-card-controls">
        <select className="add-card-priority" value={priority} onChange={e => setPriority(e.target.value as Task['priority'])}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <div className="add-card-actions">
          <button className="add-card-cancel" onClick={onClose} type="button"><X size={12} /></button>
          <button className="add-card-save btn-primary" onClick={handleSubmit} disabled={saving || !title.trim()} type="button">
            {saving ? '…' : strings.kanban.addTask}
          </button>
        </div>
      </div>
    </div>
  );
};

const KanbanPage: React.FC = () => {
  const { projects, selectedProject, fetchProject, updateTaskStatus } = useProjects();
  const { user } = useAuth();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [showMyAssigned, setShowMyAssigned]         = useState(false);
  const [selectedTaskId, setSelectedTaskId]       = useState<string>('');
  const [draggingTask, setDraggingTask]     = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [addingInCol, setAddingInCol]       = useState<TaskStatus | null>(null);
  const [didDrag, setDidDrag]               = useState(false);

  const isAssignedView = showMyAssigned;

  useEffect(() => {
    const state = location.state as { projectId?: string; taskId?: string } | null;
    if (state?.taskId) setSelectedTaskId(state.taskId);

    if (!user || projects.length === 0) return;

    if (state?.projectId && projects.some(p => p.id === state.projectId)) {
      setShowMyAssigned(false);
      setSelectedProjectId(state.projectId);
      return;
    }

    setSelectedProjectId(prev => {
      if (prev && projects.some(p => p.id === prev)) return prev;
      return pickDefaultProjectId({
        userId: user.id,
        accessibleIds: projects.map(p => p.id),
        fallbackId: projects[0]?.id,
      });
    });
  }, [location.state, projects, user]);

  useEffect(() => {
    if (!isAssignedView && selectedProjectId) fetchProject(selectedProjectId);
  }, [selectedProjectId, fetchProject, isAssignedView]);

  useEffect(() => {
    if (!isAssignedView && selectedProjectId) setLastViewedProjectId(user?.id, selectedProjectId);
  }, [selectedProjectId, user?.id, isAssignedView]);

  const project = !isAssignedView && selectedProject?.id === selectedProjectId
    ? selectedProject
    : !isAssignedView
      ? projects.find(p => p.id === selectedProjectId)
      : undefined;

  const assignedTasks = useMemo(
    () => (user ? getAssignedTasks(projects, user.id) : []),
    [projects, user]
  );

  const panelContext = useMemo((): TaskCardItem | null => {
    if (!selectedTaskId) return null;
    if (isAssignedView) {
      return assignedTasks.find(({ task }) => task.id === selectedTaskId) ?? null;
    }
    if (!project) return null;
    const task = project.tasks.find(t => t.id === selectedTaskId);
    return task ? { task, project } : null;
  }, [selectedTaskId, isAssignedView, assignedTasks, project]);

  const getColumnTasks = (status: TaskStatus): TaskCardItem[] => {
    if (isAssignedView) {
      return assignedTasks.filter(({ task }) => task.status === status);
    }
    if (!project) return [];
    return project.tasks
      .filter(t => t.status === status)
      .map(task => ({ task, project }));
  };

  const canEditProject = (p: Project) => canModifyProject(user, p);

  const handleDrop = (status: TaskStatus) => {
    if (!draggingTask) return;
    const taskProject = projects.find(p => p.id === draggingTask.projectId);
    if (!taskProject || !canEditProject(taskProject)) return;
    if (draggingTask.status !== status) {
      updateTaskStatus(taskProject.id, draggingTask.id, status);
    }
    setDraggingTask(null);
    setDragOverColumn(null);
    setDidDrag(true);
  };

  const openTask = (task: Task) => {
    if (didDrag) {
      setDidDrag(false);
      return;
    }
    setSelectedTaskId(task.id);
    setAddingInCol(null);
  };

  const closeTaskPanel = () => setSelectedTaskId('');

  const handleProjectChange = (value: string) => {
    setSelectedProjectId(value);
    setSelectedTaskId('');
    setAddingInCol(null);
  };

  const handleAssignedToggle = (checked: boolean) => {
    setShowMyAssigned(checked);
    setSelectedTaskId('');
    setAddingInCol(null);
  };

  const taskPanel = panelContext ? (
    <TaskPanel
      project={panelContext.project}
      task={panelContext.task}
      canEdit={canEditProject(panelContext.project)}
      onClose={closeTaskPanel}
    />
  ) : null;

  const showBoard = isAssignedView || !!project;
  const assignedCount = assignedTasks.length;

  return (
    <div className={`kanban-page ${panelContext ? 'kanban-page--task-open' : ''}`}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{strings.kanban.title}</h1>
          <p className="page-subtitle">
            {isAssignedView ? strings.kanban.subtitleAssigned : strings.kanban.subtitle}
          </p>
        </div>
        <div className="kanban-header-controls">
          <label className="kanban-assigned-toggle">
            <input
              type="checkbox"
              checked={showMyAssigned}
              onChange={e => handleAssignedToggle(e.target.checked)}
            />
            <span>{strings.kanban.myAssignedTasks}</span>
          </label>
          <select
            className="filter-select"
            value={selectedProjectId}
            disabled={showMyAssigned}
            onChange={e => handleProjectChange(e.target.value)}
          >
            <option value="">{strings.kanban.selectProject}</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      </div>

      {!showBoard ? (
        <div className="empty-state">
          <div className="empty-icon">🗂</div>
          <h3>{strings.kanban.selectProject}</h3>
        </div>
      ) : isAssignedView && assignedCount === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✓</div>
          <h3>{strings.kanban.noAssignedTasks}</h3>
          <p>{strings.kanban.noAssignedTasksHint}</p>
        </div>
      ) : (
        <div className="kanban-layout">
          <div className="kanban-board">
            {columns.map(col => {
              const items = getColumnTasks(col.id);
              const isAddingHere = !isAssignedView && addingInCol === col.id;
              const canEdit = !isAssignedView && project ? canEditProject(project) : false;

              return (
                <div
                  key={col.id}
                  className={`kanban-column ${dragOverColumn === col.id ? 'kanban-column--over' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOverColumn(col.id); }}
                  onDragLeave={() => setDragOverColumn(null)}
                  onDrop={() => handleDrop(col.id)}
                >
                  <div className="kanban-column-header">
                    <div className="kanban-column-title">
                      <span className="kanban-col-dot" style={{ background: col.color }} />
                      <span>{col.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span className="kanban-count">{items.length}</span>
                      {canEdit && (
                        <button
                          className="kanban-add-btn"
                          title="Add task"
                          onClick={() => setAddingInCol(isAddingHere ? null : col.id)}
                        >
                          <Plus size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="kanban-cards">
                    {isAddingHere && project && (
                      <AddCardForm
                        projectId={project.id}
                        status={col.id}
                        onClose={() => setAddingInCol(null)}
                      />
                    )}

                    {items.map(({ task, project: taskProject }) => {
                      const assignee =
                        taskProject.members.find(m => m.id === task.assigneeId) ??
                        (taskProject.coordinator?.id === task.assigneeId ? taskProject.coordinator : undefined);
                      const isSelected = selectedTaskId === task.id;
                      const cardCanEdit = canEditProject(taskProject);

                      return (
                        <div
                          key={task.id}
                          className={`kanban-card kanban-card--clickable ${isSelected ? 'kanban-card--selected' : ''} ${draggingTask?.id === task.id ? 'kanban-card--dragging' : ''}`}
                          draggable={cardCanEdit}
                          onDragStart={() => { if (cardCanEdit) setDraggingTask(task); }}
                          onDragEnd={() => {
                            if (draggingTask) setDidDrag(true);
                            setDraggingTask(null);
                            setDragOverColumn(null);
                          }}
                          onClick={() => openTask(task)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openTask(task);
                            }
                          }}
                        >
                          {isAssignedView && (
                            <Link
                              to={`/projects/${taskProject.id}`}
                              className="kanban-card-project"
                              onClick={e => e.stopPropagation()}
                            >
                              {taskProject.title}
                            </Link>
                          )}
                          <div className="kanban-card-header">
                            <Badge label={strings.kanban.priority[task.priority]} variant={priorityVariant[task.priority]} />
                            {task.dueDate && (
                              <span className="kanban-due">
                                {new Date(task.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                          <p className="kanban-card-title">{task.title}</p>
                          {task.description && <p className="kanban-card-desc">{task.description}</p>}
                          <div className="kanban-card-footer">
                            {!isAssignedView && (
                              assignee ? (
                                <UserLink
                                  userId={assignee.id}
                                  className="kanban-assignee"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <div className="kanban-assignee-avatar">{assignee.name.charAt(0)}</div>
                                  <span>{assignee.name.split(' ')[0]}</span>
                                </UserLink>
                              ) : (
                                <span className="kanban-unassigned">{strings.kanban.unassigned}</span>
                              )
                            )}
                            {isAssignedView && <span className="kanban-card-you">{strings.kanban.assignedToYou}</span>}
                            {cardCanEdit && <GripVertical size={13} className="kanban-drag-handle" />}
                          </div>
                        </div>
                      );
                    })}

                    {items.length === 0 && !isAddingHere && (
                      <div className={`kanban-empty ${dragOverColumn === col.id ? 'kanban-empty--active' : ''}`}>
                        {strings.kanban.dropHere}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {taskPanel && !isMobile && (
            <aside className="kanban-task-sidebar" aria-label={strings.kanban.viewTask}>
              {taskPanel}
            </aside>
          )}
        </div>
      )}

      {taskPanel && isMobile && (
        <div
          className="modal-overlay kanban-task-modal"
          onClick={e => { if (e.target === e.currentTarget) closeTaskPanel(); }}
        >
          <div className="modal" onClick={e => e.stopPropagation()}>
            {taskPanel}
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanPage;
