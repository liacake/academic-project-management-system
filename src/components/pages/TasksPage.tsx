import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { getAssignedTasks } from '../../lib/userTasks';
import Badge from '../ui/Badge';
import strings from '../ui/strings';
import './TasksPage.css';

const taskStatusVariant: Record<string, 'default' | 'info' | 'warning' | 'success'> = {
  todo: 'default', 'in-progress': 'info', review: 'warning', done: 'success',
};

const priorityVariant: Record<string, 'danger' | 'warning' | 'neutral'> = {
  high: 'danger', medium: 'warning', low: 'neutral',
};

const TasksPage: React.FC = () => {
  const { projects } = useProjects();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectFilter = searchParams.get('project') ?? 'all';

  const assignedOpen = useMemo(
    () => (user ? getAssignedTasks(projects, user.id, { openOnly: true }) : []),
    [projects, user]
  );

  const projectOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const { project } of assignedOpen) {
      if (!seen.has(project.id)) seen.set(project.id, project.title);
    }
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [assignedOpen]);

  const filtered = useMemo(() => {
    const list = projectFilter === 'all'
      ? assignedOpen
      : assignedOpen.filter(({ project }) => project.id === projectFilter);
    return [...list].sort((a, b) => {
      const dueA = a.task.dueDate ? new Date(a.task.dueDate).getTime() : Infinity;
      const dueB = b.task.dueDate ? new Date(b.task.dueDate).getTime() : Infinity;
      if (dueA !== dueB) return dueA - dueB;
      return a.project.title.localeCompare(b.project.title) || a.task.title.localeCompare(b.task.title);
    });
  }, [assignedOpen, projectFilter]);

  const setProjectFilter = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all') next.delete('project');
    else next.set('project', value);
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
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✓</div>
          <h3>{strings.tasks.emptyTitle}</h3>
          <p>{strings.tasks.emptyHint}</p>
        </div>
      ) : (
        <div className="tasks-list-page">
          {filtered.map(({ task, project }) => (
            <div
              key={task.id}
              className="task-list-item"
              role="button"
              tabIndex={0}
              onClick={() => openInKanban(project.id, task.id)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openInKanban(project.id, task.id);
                }
              }}
            >
              <div className="task-list-item-main">
                <span className="task-list-item-title">{task.title}</span>
                <span className="task-list-item-project">{project.title}</span>
                {task.description && (
                  <span className="task-list-item-desc">{task.description}</span>
                )}
              </div>
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
          ))}
        </div>
      )}
    </div>
  );
};

export default TasksPage;
