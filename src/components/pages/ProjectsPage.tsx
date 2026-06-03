import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { canCreateProjects, canViewAllProjects } from '../../lib/permissions';
import { ProjectStatus } from '../../types';
import ProjectCard from '../ui/ProjectCard';
import strings from '../ui/strings';
import NewProjectModal from '../modals/NewProjectModal';
import './ProjectsPage.css';

const ProjectsPage: React.FC = () => {
  const { projects } = useProjects();
  const { user } = useAuth();
  const navigate = useNavigate();
  const showCreate = canCreateProjects(user?.role);
  const overviewMode = canViewAllProjects(user?.role);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated');

  const statusFilter = useMemo((): ProjectStatus | 'all' => {
    const param = searchParams.get('status');
    if (param && param in strings.projects.status) return param as ProjectStatus;
    return 'all';
  }, [searchParams]);

  const setStatusFilter = (value: ProjectStatus | 'all') => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all') next.delete('status');
    else next.set('status', value);
    setSearchParams(next, { replace: true });
  };

  const filtered = projects
    .filter(p => {
      const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.technologies.some(t => t.name.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'title')   return a.title.localeCompare(b.title);
      if (sortBy === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return (
    <div className="projects-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{strings.projects.title}</h1>
          <p className="page-subtitle">
            {overviewMode
              ? `${strings.projects.subtitleOverview} · ${filtered.length} of ${projects.length}`
              : `${filtered.length} project${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {showCreate && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ {strings.projects.new}</button>
        )}
      </div>

      <div className="projects-toolbar">
        <div className="search-wrapper">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder={strings.projects.search}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}><X size={13} /></button>
          )}
        </div>

        <div className="toolbar-filters">
          <SlidersHorizontal size={15} className="filter-icon" />
          <select className="filter-select" value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as ProjectStatus | 'all')}>
            <option value="all">{strings.projects.allStatuses}</option>
            {Object.entries(strings.projects.status).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select className="filter-select" value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}>
            <option value="updated">Recently Updated</option>
            <option value="created">Recently Created</option>
            <option value="title">Title A–Z</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <h3>{strings.projects.noProjects}</h3>
          <p>{strings.projects.noProjectsHint}</p>
          {showCreate && (
            <button className="btn-primary" onClick={() => setShowModal(true)}>+ {strings.projects.new}</button>
          )}
        </div>
      ) : (
        <div className="projects-grid-full">
          {filtered.map(project => (
            <ProjectCard key={project.id} project={project} onClick={() => navigate(`/projects/${project.id}`)} />
          ))}
        </div>
      )}

      {showModal && <NewProjectModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default ProjectsPage;
