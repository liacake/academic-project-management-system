import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { GripVertical } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
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

const KanbanPage: React.FC = () => {
  const { projects, fetchProject, updateTaskStatus } = useProjects();
  const location = useLocation();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [draggingTask, setDraggingTask]     = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  useEffect(() => {
    const state = location.state as { projectId?: string } | null;
    if (state?.projectId) setSelectedProjectId(state.projectId);
    else if (projects.length > 0 && !selectedProjectId) setSelectedProjectId(projects[0].id);
  }, [location.state, projects]);

  // Load tasks whenever selected project changes
  useEffect(() => {
    if (selectedProjectId) fetchProject(selectedProjectId);
  }, [selectedProjectId]);

  const project = projects.find(p => p.id === selectedProjectId);
  const getColumnTasks = (status: TaskStatus): Task[] =>
    project?.tasks.filter(t => t.status === status) ?? [];

  const handleDrop = (status: TaskStatus) => {
    if (draggingTask && draggingTask.status !== status && project)
      updateTaskStatus(project.id, draggingTask.id, status);
    setDraggingTask(null);
    setDragOverColumn(null);
  };

  return (
    <div className="kanban-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{strings.kanban.title}</h1>
          <p className="page-subtitle">{strings.kanban.subtitle}</p>
        </div>
        <select className="filter-select" value={selectedProjectId}
          onChange={e => setSelectedProjectId(e.target.value)}>
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
                  <span className="kanban-count">{tasks.length}</span>
                </div>

                <div className="kanban-cards">
                  {tasks.map(task => {
                    const assignee = project.members.find(m => m.id === task.assigneeId);
                    return (
                      <div
                        key={task.id}
                        className={`kanban-card ${draggingTask?.id === task.id ? 'kanban-card--dragging' : ''}`}
                        draggable
                        onDragStart={() => setDraggingTask(task)}
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
                  {tasks.length === 0 && (
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
