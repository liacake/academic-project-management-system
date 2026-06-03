import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { GripVertical, Plus, X } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { canModifyProject } from '../../lib/permissions';
import { TaskStatus, Task } from '../../types';
import Badge from '../ui/Badge';
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
        placeholder="Task title…"
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
            {saving ? '…' : 'Add'}
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
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [draggingTask, setDraggingTask]     = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [addingInCol, setAddingInCol]       = useState<TaskStatus | null>(null);

  useEffect(() => {
    const state = location.state as { projectId?: string } | null;
    if (state?.projectId) setSelectedProjectId(state.projectId);
    else if (projects.length > 0 && !selectedProjectId) setSelectedProjectId(projects[0].id);
  }, [location.state, projects]);

  useEffect(() => {
    if (selectedProjectId) fetchProject(selectedProjectId);
  }, [selectedProjectId]);

  const project = selectedProject?.id === selectedProjectId
    ? selectedProject
    : projects.find(p => p.id === selectedProjectId);

  const getColumnTasks = (status: TaskStatus): Task[] =>
    project?.tasks.filter(t => t.status === status) ?? [];

  const handleDrop = (status: TaskStatus) => {
    if (!canEdit) return;
    if (draggingTask && draggingTask.status !== status && project)
      updateTaskStatus(project.id, draggingTask.id, status);
    setDraggingTask(null);
    setDragOverColumn(null);
  };

  const canEdit = project ? canModifyProject(user, project) : false;

  return (
    <div className="kanban-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{strings.kanban.title}</h1>
          <p className="page-subtitle">{strings.kanban.subtitle}</p>
        </div>
        <select className="filter-select" value={selectedProjectId}
          onChange={e => { setSelectedProjectId(e.target.value); setAddingInCol(null); }}>
          <option value="">Select a project...</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>

      {!project ? (
        <div className="empty-state">
          <div className="empty-icon">🗂</div>
          <h3>{strings.kanban.selectProject}</h3>
        </div>
      ) : (
        <div className="kanban-board">
          {columns.map(col => {
            const tasks = getColumnTasks(col.id);
            const isAddingHere = addingInCol === col.id;

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
                    <span className="kanban-count">{tasks.length}</span>
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
                  {isAddingHere && (
                    <AddCardForm
                      projectId={project.id}
                      status={col.id}
                      onClose={() => setAddingInCol(null)}
                    />
                  )}

                  {tasks.map(task => {
                    const assignee = project.members.find(m => m.id === task.assigneeId);
                    return (
                      <div
                        key={task.id}
                        className={`kanban-card ${draggingTask?.id === task.id ? 'kanban-card--dragging' : ''}`}
                        draggable={canEdit}
                        onDragStart={() => canEdit && setDraggingTask(task)}
                        onDragEnd={() => { setDraggingTask(null); setDragOverColumn(null); }}
                      >
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
                          {assignee ? (
                            <div className="kanban-assignee">
                              <div className="kanban-assignee-avatar">{assignee.name.charAt(0)}</div>
                              <span>{assignee.name.split(' ')[0]}</span>
                            </div>
                          ) : (
                            <span className="kanban-unassigned">{strings.kanban.unassigned}</span>
                          )}
                          <GripVertical size={13} className="kanban-drag-handle" />
                        </div>
                      </div>
                    );
                  })}

                  {tasks.length === 0 && !isAddingHere && (
                    <div className={`kanban-empty ${dragOverColumn === col.id ? 'kanban-empty--active' : ''}`}>
                      Drop tasks here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KanbanPage;
