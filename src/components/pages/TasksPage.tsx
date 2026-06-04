import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { getAssignedTasks } from '../../lib/userTasks';
import { TaskStatus } from '../../types';
import Badge from '../ui/Badge';
import TaskStatusMove from '../tasks/TaskStatusMove';
import strings from '../ui/strings';
import './TasksPage.css';

const taskStatusVariant: Record<string, 'default' | 'info' | 'warning' | 'success'> = {
  todo: 'default', 'in-progress': 'info', review: 'warning', done: 'success',
};

const priorityVariant: Record<string, 'danger' | 'warning' | 'neutral'> = {
  high: 'danger', medium: 'warning', low: 'neutral',
};

const TASK_STATUSES: TaskStatus[] = ['todo', 'in-progress', 'review', 'done'];

function parseStatusFilter(value: string | null): TaskStatus | 'all' {
  if (!value || value === 'all') return 'all';
  return TASK_STATUSES.includes(value as TaskStatus) ? (value as TaskStatus) : 'all';
}

const TasksPage: React.FC = () => {
  const { projects } = useProjects();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectFilter = searchParams.get('project') ?? 'all';
  const statusFilter = parseStatusFilter(searchParams.get('status'));

  const assigned = useMemo(
    () => (user ? getAssignedTasks(projects, user.id) : []),
    [projects, user]
  );

  const projectOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const { project } of assigned) {
      if (!seen.has(project.id)) seen.set(project.id, project.title);
    }
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [assigned]);

  const filtered = useMemo(() => {
    let list = assigned;
    if (statusFilter === 'all') {
      list = list.filter(({ task }) => task.status !== 'done');
    } else {
      list = list.filter(({ task }) => task.status === statusFilter);
    }
    if (projectFilter !== 'all') {
      list = list.filter(({ project }) => project.id === projectFilter);
    }
    return [...list].sort((a, b) => {
      const dueA = a.task.dueDate ? new Date(a.task.dueDate).getTime() : Infinity;
      const dueB = b.task.dueDate ? new Date(b.task.dueDate).getTime() : Infinity;
      if (dueA !== dueB) return dueA - dueB;
      return a.project.title.localeCompare(b.project.title) || a.task.title.localeCompare(b.task.title);
    });
  }, [assigned, projectFilter, statusFilter]);

  const filtersActive = projectFilter !== 'all' || statusFilter !== 'all';

  const setProjectFilter = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all') next.delete('project');
    else next.set('project', value);
    setSearchParams(next, { replace: true });
  };

  const setStatusFilter = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all') next.delete('status');
    else next.set('status', value);
    setSearchParams(next, { replace: true });
  };

  const openInKanban = (projectId: string, taskId: string) => {
    navigate('/kanban', { state: { projectId, taskId } });
  };

  return (
    <div className="tasks-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{strings.tasks.title}</h1>
          <p className="page-subtitle">
            {strings.tasks.subtitle.replace('{n}', String(filtered.length))}
          </p>
        </div>
      </div>

      <div className="tasks-toolbar">
        <div className="toolbar-filters">
          <SlidersHorizontal size={15} className="filter-icon" />
          <label className="tasks-filter-label" htmlFor="tasks-project-filter">
            {strings.tasks.filterProject}
          </label>
          <select
            id="tasks-project-filter"
            className="filter-select"
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
          >
            <option value="all">{strings.tasks.allProjects}</option>
            {projectOptions.map(([id, title]) => (
              <option key={id} value={id}>{title}</option>
            ))}
          </select>
          <label className="tasks-filter-label" htmlFor="tasks-status-filter">
            {strings.tasks.filterStatus}
          </label>
          <select
            id="tasks-status-filter"
            className="filter-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">{strings.tasks.allStatuses}</option>
            {TASK_STATUSES.map(status => (
              <option key={status} value={status}>
                {strings.kanban.columns[status]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✓</div>
          <h3>{filtersActive ? strings.tasks.emptyFilteredTitle : strings.tasks.emptyTitle}</h3>
          <p>{filtersActive ? strings.tasks.emptyFilteredHint : strings.tasks.emptyHint}</p>
        </div>
      ) : (
        <div className="tasks-list-page">
          {filtered.map(({ task, project }) => (
            <div key={task.id} className="task-list-item">
              <button
                type="button"
                className="task-list-item-open"
                onClick={() => openInKanban(project.id, task.id)}
                aria-label={`${strings.tasks.openInKanban}: ${task.title}`}
              >
                <span className="task-list-item-title">{task.title}</span>
                <span className="task-list-item-project">{project.title}</span>
                {task.description && (
                  <span className="task-list-item-desc">{task.description}</span>
                )}
              </button>
              <div className="task-list-item-side">
                <TaskStatusMove project={project} task={task} />
                <div className="task-list-item-meta">
                  <Badge
                    label={strings.kanban.columns[task.status]}
                    variant={taskStatusVariant[task.status]}
                  />
                  <Badge
                    label={strings.kanban.priority[task.priority]}
                    variant={priorityVariant[task.priority]}
                  />
                  {task.dueDate && (
                    <span className="task-list-item-due">
                      {strings.kanban.due}{' '}
                      {new Date(task.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TasksPage;
