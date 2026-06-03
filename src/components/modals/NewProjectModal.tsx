import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { useTechnologies } from '../../context/TechnologyContext';
import { useTeam } from '../../context/TeamContext';
import { ProjectStatus, Technology, User } from '../../types';
import { isValidProjectDateRange } from '../../lib/dates';
import strings from '../ui/strings';
import './Modal.css';

interface NewProjectModalProps { onClose: () => void; }

const NewProjectModal: React.FC<NewProjectModalProps> = ({ onClose }) => {
  const { addProject } = useProjects();
  const { user } = useAuth();
  const { technologies } = useTechnologies();
  const { users } = useTeam();

  const [title, setTitle]               = useState('');
  const [description, setDescription]   = useState('');
  const [status, setStatus]             = useState<ProjectStatus>('planning');
  const [selectedTechs, setSelectedTechs]     = useState<Technology[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<User[]>(user ? [user as User] : []);
  const [semester, setSemester]         = useState('');
  const [year, setYear]                 = useState<number>(new Date().getFullYear());
  const [startDate, setStartDate]       = useState('');
  const [endDate, setEndDate]           = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [demoUrl, setDemoUrl]           = useState('');
  const [isPublic, setIsPublic]         = useState(true);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');

  const toggleTech = (tech: Technology) =>
    setSelectedTechs(prev => prev.find(t => t.id === tech.id) ? prev.filter(t => t.id !== tech.id) : [...prev, tech]);

  const toggleMember = (member: User) =>
    setSelectedMembers(prev => prev.find(m => m.id === member.id) ? prev.filter(m => m.id !== member.id) : [...prev, member]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidProjectDateRange(startDate || undefined, endDate || undefined)) {
      setError(strings.modal.invalidDateRange);
      return;
    }
    setSaving(true);
    setError('');
    const result = await addProject({
      title, description, status,
      technologies: selectedTechs,
      members: selectedMembers,
      ownerId: user?.id || '',
      semester: semester || undefined,
      year,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      repositoryUrl: repositoryUrl || undefined,
      demoUrl: demoUrl || undefined,
      isPublic,
    });
    setSaving(false);
    if (result) {
      onClose();
    } else {
      setError('Failed to create project. Please try again.');
    }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h2>{strings.modal.newProject}</h2>
          <button className="modal-close" onClick={onClose}><X size={14} /></button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>{strings.modal.titleLabel}</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={strings.modal.titlePlaceholder} required />
            </div>
            <div className="form-group">
              <label>{strings.modal.descriptionLabel}</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={strings.modal.descriptionPlaceholder} rows={3} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{strings.modal.statusLabel}</label>
                <select value={status} onChange={e => setStatus(e.target.value as ProjectStatus)}>
                  {Object.entries(strings.projects.status).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>{strings.modal.visibilityLabel}</label>
                <select value={isPublic ? 'public' : 'private'} onChange={e => setIsPublic(e.target.value === 'public')}>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{strings.modal.startDateLabel}</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>{strings.modal.endDateLabel}</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate || undefined} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{strings.modal.semesterLabel}</label>
                <select value={semester} onChange={e => setSemester(e.target.value)}>
                  <option value="">Not set</option>
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                  <option value="Fall">Fall</option>
                  <option value="Winter">Winter</option>
                </select>
              </div>
              <div className="form-group">
                <label>{strings.modal.yearLabel}</label>
                <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} min={2020} max={2030} />
              </div>
            </div>
            <div className="form-group">
              <label>{strings.modal.technologiesLabel}</label>
              <div className="tech-picker">
                {technologies.map(tech => (
                  <button key={tech.id} type="button"
                    className={`tech-pick-btn ${selectedTechs.find(t => t.id === tech.id) ? 'selected' : ''}`}
                    style={selectedTechs.find(t => t.id === tech.id) ? { borderColor: tech.color, background: `${tech.color}22`, color: tech.color } : {}}
                    onClick={() => toggleTech(tech)}>
                    {tech.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Team Members</label>
              <div className="member-picker">
                {users.map(member => (
                  <button key={member.id} type="button"
                    className={`member-pick-btn ${selectedMembers.find(m => m.id === member.id) ? 'selected' : ''}`}
                    onClick={() => toggleMember(member)}>
                    <span className="pick-avatar">{member.name.charAt(0)}</span>
                    <span>{member.name}</span>
                    {selectedMembers.find(m => m.id === member.id) && <span className="pick-check">✓</span>}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{strings.modal.repositoryLabel}</label>
                <input type="url" value={repositoryUrl} onChange={e => setRepositoryUrl(e.target.value)} placeholder={strings.modal.repositoryPlaceholder} />
              </div>
              <div className="form-group">
                <label>{strings.modal.demoLabel}</label>
                <input type="url" value={demoUrl} onChange={e => setDemoUrl(e.target.value)} placeholder={strings.modal.demoPlaceholder} />
              </div>
            </div>
            {error && <div className="login-error">{error}</div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>{strings.modal.cancel}</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : strings.modal.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectModal;
