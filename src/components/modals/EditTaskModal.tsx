import { Project, Task } from '../../types';
import TaskPanel from '../tasks/TaskPanel';
import './Modal.css';

interface EditTaskModalProps {
  project: Project;
  task: Task;
  onClose: () => void;
  canEdit?: boolean;
}

/** @deprecated Prefer TaskPanel via KanbanPage */
const EditTaskModal: React.FC<EditTaskModalProps> = ({ project, task, onClose, canEdit = true }) => (
  <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="modal modal--task">
      <TaskPanel project={project} task={task} canEdit={canEdit} onClose={onClose} />
    </div>
  </div>
);

export default EditTaskModal;
