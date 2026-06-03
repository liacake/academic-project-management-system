import { useMemo, useState, FormEvent } from 'react';
import { X } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { Project, Task, TaskStatus, User } from '../../types';
import strings from '../ui/strings';
import './Modal.css';

interface EditTaskModalProps {
  project: Project;
  task: Task;
  onClose: () => void;
}

function collectAssignees(project: Project): User[] {
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

const EditTaskModal: React.FC<EditTaskModalProps> = ({ project, task, onClose }) => {
  const { updateTask } = useProjects();
  const assignees = useMemo(() => collectAssignees(project), [project]);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<Task['priority']>(task.priority);
  const [assigneeId, setAssigneeId] = useState(task.assigneeId ?? '');
  const [dueDate, setDueDate] = useState(task.dueDate ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError('');
    try {
      await updateTask(project.id, task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        assigneeId: assigneeId || undefined,
        dueDate: dueDate || undefined,
      });
      onClose();
    } catch {
      setError('Failed to save task. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div className="modal modal--task">
        <div className="modal-header">
          <h2>{strings.kanban.editTask}</h2>
          <button type="button" className="modal-close" onClick={onClose} disabled={saving}>
            <X size={14} />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-body">
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
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="task-status">{strings.kanban.taskStatus}</label>
                <select id="task-status" value={status} onChange={e => setStatus(e.target.value as TaskStatus)}>
                  {Object.entries(strings.kanban.columns).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="task-priority">{strings.kanban.taskPriority}</label>
                <select id="task-priority" value={priority} onChange={e => setPriority(e.target.value as Task['priority'])}>
                  {Object.entries(strings.kanban.priority).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

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

            {error && <div className="login-error">{error}</div>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={saving}>
              {strings.modal.cancel}
            </button>
            <button type="submit" className="btn-primary" disabled={saving || !title.trim()}>
              {saving ? 'Saving…' : strings.kanban.saveTask}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal;
