import { useMemo, useState, useEffect, FormEvent } from 'react';
import { X, Pencil, Trash2 } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { Project, Task, TaskStatus, User } from '../../types';
import Badge from '../ui/Badge';
import UserLink from '../ui/UserLink';
import strings from '../ui/strings';
import '../modals/Modal.css';
import './TaskPanel.css';

export function collectAssignees(project: Project): User[] {
  const seen = new Set<string>();
  const list: User[] = [];
  const add = (user: User | undefined) => {
    if (!user || seen.has(user.id)) return;
    seen.add(user.id);
    list.push(user);
  };
  if (project.coordinator) add(project.coordinator);
  for (const member of project.members) add(member);
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

const priorityVariant: Record<string, 'danger' | 'warning' | 'neutral'> = {
  high: 'danger', medium: 'warning', low: 'neutral',
};

const statusVariant: Record<string, 'default' | 'info' | 'warning' | 'success'> = {
  todo: 'default', 'in-progress': 'info', review: 'warning', done: 'success',
};

function resolveAssignee(project: Project, assigneeId?: string): User | undefined {
  if (!assigneeId) return undefined;
  return (
    project.members.find(m => m.id === assigneeId) ??
    (project.coordinator?.id === assigneeId ? project.coordinator : undefined)
  );
}

function formatDueDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface TaskPanelProps {
  project: Project;
  task: Task;
  canEdit: boolean;
  canEditStatus?: boolean;
  canDelete?: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

const TaskPanel: React.FC<TaskPanelProps> = ({
  project,
  task,
  canEdit,
  canEditStatus = false,
  canDelete = false,
  onClose,
  onDeleted,
}) => {
  const { updateTask, deleteTask } = useProjects();
  const assignees = useMemo(() => collectAssignees(project), [project]);
  const assignee = resolveAssignee(project, task.assigneeId);
  const statusOnly = !canEdit && canEditStatus;

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<Task['priority']>(task.priority);
  const [assigneeId, setAssigneeId] = useState(task.assigneeId ?? '');
  const [dueDate, setDueDate] = useState(task.dueDate ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setEditing(false);
    setTitle(task.title);
    setDescription(task.description ?? '');
    setStatus(task.status);
    setPriority(task.priority);
    setAssigneeId(task.assigneeId ?? '');
    setDueDate(task.dueDate ?? '');
    setError('');
  }, [task.id, task.title, task.description, task.status, task.priority, task.assigneeId, task.dueDate]);

  const resetForm = () => {
    setTitle(task.title);
    setDescription(task.description ?? '');
    setStatus(task.status);
    setPriority(task.priority);
    setAssigneeId(task.assigneeId ?? '');
    setDueDate(task.dueDate ?? '');
    setError('');
  };

  const handleCancelEdit = () => {
    resetForm();
    setEditing(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !statusOnly) return;
    setSaving(true);
    setError('');
    try {
      if (statusOnly) {
        await updateTask(project.id, task.id, { status });
      } else {
        await updateTask(project.id, task.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          priority,
          assigneeId: assigneeId || undefined,
          dueDate: dueDate || undefined,
        });
      }
      setEditing(false);
    } catch {
      setError(strings.kanban.saveError);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (next: TaskStatus) => {
    if (next === task.status) return;
    setStatus(next);
    setSaving(true);
    setError('');
    try {
      await updateTask(project.id, task.id, { status: next });
    } catch {
      setStatus(task.status);
      setError(strings.kanban.saveError);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(strings.kanban.confirmDeleteTask)) return;
    setDeleting(true);
    setError('');
    try {
      await deleteTask(project.id, task.id);
      onDeleted?.();
      onClose();
    } catch {
      setError(strings.kanban.deleteTaskError);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="task-panel">
      <div className="task-panel-header">
        <h2 className="task-panel-title">
          {editing ? strings.kanban.editTask : strings.kanban.viewTask}
        </h2>
        <div className="task-panel-header-actions">
          {canEdit && !editing && (
            <button
              type="button"
              className="task-panel-edit-btn"
              onClick={() => setEditing(true)}
            >
              <Pencil size={13} /> {strings.kanban.editTaskBtn}
            </button>
          )}
          {statusOnly && !editing && (
            <button
              type="button"
              className="task-panel-edit-btn"
              onClick={() => setEditing(true)}
            >
              <Pencil size={13} /> {strings.kanban.changeStatus}
            </button>
          )}
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={saving || deleting}
            aria-label={strings.modal.close}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {editing ? (
        <form className="task-panel-form" onSubmit={handleSubmit}>
          <div className="task-panel-body">
            {!statusOnly && (
              <>
                <div className="form-group">
                  <label htmlFor="task-title">{strings.kanban.taskTitle}</label>
                  <input
                    id="task-title"
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="task-desc">{strings.kanban.taskDescription}</label>
                  <textarea
                    id="task-desc"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder={strings.kanban.taskDescriptionPlaceholder}
                    rows={4}
                  />
                </div>
              </>
            )}

            <div className={statusOnly ? 'form-group' : 'form-row'}>
              <div className="form-group">
                <label htmlFor="task-status">{strings.kanban.taskStatus}</label>
                <select id="task-status" value={status} onChange={e => setStatus(e.target.value as TaskStatus)}>
                  {Object.entries(strings.kanban.columns).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              {!statusOnly && (
                <div className="form-group">
                  <label htmlFor="task-priority">{strings.kanban.taskPriority}</label>
                  <select id="task-priority" value={priority} onChange={e => setPriority(e.target.value as Task['priority'])}>
                    {Object.entries(strings.kanban.priority).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {!statusOnly && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="task-assignee">{strings.kanban.taskAssignee}</label>
                  <select id="task-assignee" value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
                    <option value="">{strings.kanban.unassigned}</option>
                    {assignees.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="task-due">{strings.kanban.taskDueDate}</label>
                  <input
                    id="task-due"
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            {error && <div className="login-error">{error}</div>}
          </div>

          <div className="task-panel-footer">
            <button type="button" className="btn-cancel" onClick={handleCancelEdit} disabled={saving}>
              {strings.kanban.cancelEdit}
            </button>
            <button type="submit" className="btn-primary" disabled={saving || (!statusOnly && !title.trim())}>
              {saving ? strings.kanban.saving : strings.kanban.saveTask}
            </button>
          </div>
        </form>
      ) : (
        <div className="task-panel-body task-panel-view">
          <h3 className="task-view-heading">{task.title}</h3>

          <div className="task-view-section">
            <span className="task-view-label">{strings.kanban.taskDescription}</span>
            <p className={`task-view-text ${!task.description ? 'task-view-text--muted' : ''}`}>
              {task.description?.trim() || strings.kanban.noDescription}
            </p>
          </div>

          <div className="task-view-meta">
            <div className="task-view-row">
              <span className="task-view-label">{strings.kanban.taskStatus}</span>
              {statusOnly ? (
                <select
                  className="task-panel-status-select"
                  value={status}
                  disabled={saving}
                  onChange={e => handleStatusChange(e.target.value as TaskStatus)}
                  aria-label={strings.kanban.taskStatus}
                >
                  {Object.entries(strings.kanban.columns).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              ) : (
                <Badge
                  label={strings.kanban.columns[task.status]}
                  variant={statusVariant[task.status]}
                />
              )}
            </div>
            <div className="task-view-row">
              <span className="task-view-label">{strings.kanban.taskPriority}</span>
              <Badge
                label={strings.kanban.priority[task.priority]}
                variant={priorityVariant[task.priority]}
              />
            </div>
            <div className="task-view-row">
              <span className="task-view-label">{strings.kanban.taskAssignee}</span>
              {assignee ? (
                <UserLink userId={assignee.id} className="task-view-assignee">
                  <span className="task-view-assignee-avatar">{assignee.name.charAt(0)}</span>
                  <span>{assignee.name}</span>
                </UserLink>
              ) : (
                <span className="task-view-muted">{strings.kanban.unassigned}</span>
              )}
            </div>
            <div className="task-view-row">
              <span className="task-view-label">{strings.kanban.taskDueDate}</span>
              <span className={task.dueDate ? 'task-view-value' : 'task-view-muted'}>
                {task.dueDate ? formatDueDate(task.dueDate) : strings.kanban.noDueDate}
              </span>
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}
        </div>
      )}

      {canDelete && !editing && (
        <div className="task-panel-footer task-panel-footer--danger">
          <button
            type="button"
            className="btn-danger"
            onClick={handleDelete}
            disabled={deleting || saving}
          >
            <Trash2 size={14} /> {deleting ? strings.kanban.saving : strings.kanban.deleteTask}
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskPanel;
