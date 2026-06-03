import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { useTechnologies } from '../../context/TechnologyContext';
import { Project, ProjectStatus, Technology } from '../../types';
import strings from '../ui/strings';
import './Modal.css';

interface EditProjectModalProps { project: Project; onClose: () => void; }

const EditProjectModal: React.FC<EditProjectModalProps> = ({ project, onClose }) => {
  const { updateProject } = useProjects();
  const { technologies } = useTechnologies();

  const [title, setTitle]             = useState(project.title);
  const [description, setDescription] = useState(project.description);
  const [status, setStatus]           = useState<ProjectStatus>(project.status);
  const [selectedTechs, setSelectedTechs] = useState<Technology[]>(project.technologies);
  const [semester, setSemester]       = useState(project.semester ?? '');
  const [year, setYear]               = useState<number>(project.year ?? new Date().getFullYear());
  const [repositoryUrl, setRepositoryUrl] = useState(project.repositoryUrl ?? '');
  const [demoUrl, setDemoUrl]         = useState(project.demoUrl ?? '');
  const [isPublic, setIsPublic]       = useState(project.isPublic);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  const toggleTech = (tech: Technology) =>
    setSelectedTechs(prev =>
      prev.find(t => t.id === tech.id) ? prev.filter(t => t.id !== tech.id) : [...prev, tech]
    );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await updateProject(project.id, {
        title, description, status,
        technologies: selectedTechs,
        semester: semester || undefined,
        year,
        repositoryUrl: repositoryUrl || undefined,
        demoUrl: demoUrl || undefined,
        isPublic,
      });
      onClose();
    } catch {
      setError('Failed to save changes. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h2>{strings.modal.editProject}</h2>
          <button type="button" className="modal-close" onClick={onClose}><X size={14} /></button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>{strings.modal.titleLabel}</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>{strings.modal.descriptionLabel}</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{strings.modal.statusLabel}</label>
                <select value={status} onChange={e => setStatus(e.target.value as ProjectStatus)}>
                  {Object.entries(strings.projects.status).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{strings.modal.visibilityLabel}</label>
                <select value={isPublic ? 'public' : 'private'} onChange={e => setIsPublic(e.target.value === 'public')}>
                  <option value="public">{strings.projects.public}</option>
                  <option value="private">{strings.projects.private}</option>
                </select>
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
                <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} min={2020} max={2035} />
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
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : strings.modal.save}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProjectModal;
