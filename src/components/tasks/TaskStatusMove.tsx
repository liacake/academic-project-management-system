import { useState } from 'react';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { canMoveAssignedTask } from '../../lib/permissions';
import { Project, Task, TaskStatus } from '../../types';
import strings from '../ui/strings';
import './TaskStatusMove.css';

const STATUSES: TaskStatus[] = ['todo', 'in-progress', 'review', 'done'];

interface TaskStatusMoveProps {
  project: Project;
  task: Task;
}

const TaskStatusMove: React.FC<TaskStatusMoveProps> = ({ project, task }) => {
  const { user } = useAuth();
  const { updateTaskStatus } = useProjects();
  const [moving, setMoving] = useState<TaskStatus | null>(null);

  if (!canMoveAssignedTask(user, task, project)) return null;

  const handleMove = async (status: TaskStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    if (status === task.status || moving) return;
    setMoving(status);
    await updateTaskStatus(project.id, task.id, status);
    setMoving(null);
  };

  return (
    <div
      className="task-status-move"
      role="group"
      aria-label={strings.tasks.moveStatus}
      onClick={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
    >
      {STATUSES.map(status => {
        const isCurrent = task.status === status;
        const isLoading = moving === status;
        return (
          <button
            key={status}
            type="button"
            className={`task-status-move-btn ${isCurrent ? 'is-current' : ''}`}
            disabled={isCurrent || moving !== null}
            aria-current={isCurrent ? 'true' : undefined}
            aria-pressed={isCurrent}
            title={strings.kanban.columns[status]}
            onClick={e => handleMove(status, e)}
          >
            {isLoading ? '…' : strings.kanban.columns[status]}
          </button>
        );
      })}
    </div>
  );
};

export default TaskStatusMove;
