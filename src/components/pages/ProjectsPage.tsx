import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { canCreateProjects, canViewAllProjects } from '../../lib/permissions';
import {
  PROJECTS_PAGE_SIZE,
  filterProjectsForRole,
  showMyProjectsFilter,
} from '../../lib/projectFilters';
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
  const showScopeFilter = showMyProjectsFilter(user?.role);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated');
  const [myProjectsOnly, setMyProjectsOnly] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PROJECTS_PAGE_SIZE);

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

  const scopeFiltered = useMemo(
    () => filterProjectsForRole(projects, user, showScopeFilter && myProjectsOnly),
    [projects, user, showScopeFilter, myProjectsOnly]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scopeFiltered
      .filter(p => {
        const matchSearch = !q ||
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.technologies.some(t => t.name.toLowerCase().includes(q));
        const matchStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'created') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [scopeFiltered, search, statusFilter, sortBy]);

  useEffect(() => {
    setVisibleCount(PROJECTS_PAGE_SIZE);
  }, [search, statusFilter, sortBy, myProjectsOnly]);

  const visibleProjects = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visibleProjects.length;
  const hasMore = remaining > 0;

  const scopeFilterLabel = user?.role === 'coordinator'
    ? strings.projects.filterMyCoordinate
    : strings.projects.filterMyMember;

  const subtitle = overviewMode && !showScopeFilter
    ? `${strings.projects.subtitleOverview} · ${strings.projects.showingCount
        .replace('{shown}', String(visibleProjects.length))
        .replace('{total}', String(filtered.length))}`
    : strings.projects.showingCount
        .replace('{shown}', String(visibleProjects.length))
        .replace('{total}', String(filtered.length));

  return (
    <div className="projects-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{strings.projects.title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
        {showCreate && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + {strings.projects.new}
          </button>
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
            <button type="button" className="search-clear" onClick={() => setSearch('')}>
              <X size={13} />
            </button>
          )}
        </div>

        <div className="toolbar-filters">
          {showScopeFilter && (
            <label className="projects-scope-filter">
              <input
                type="checkbox"
                checked={myProjectsOnly}
                onChange={e => setMyProjectsOnly(e.target.checked)}
              />
              <span>{scopeFilterLabel}</span>
            </label>
          )}
          <SlidersHorizontal size={15} className="filter-icon" />
          <select
            className="filter-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as ProjectStatus | 'all')}
          >
            <option value="all">{strings.projects.allStatuses}</option>
            {Object.entries(strings.projects.status).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            className="filter-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
          >
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
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              + {strings.projects.new}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="projects-grid-full">
            {visibleProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => navigate(`/projects/${project.id}`)}
              />
            ))}
          </div>

          {hasMore && (
            <div className="projects-show-more">
              <button
                type="button"
                className="btn-secondary projects-show-more-btn"
                onClick={() => setVisibleCount(c => c + PROJECTS_PAGE_SIZE)}
              >
                {strings.projects.showMoreCount.replace(
                  '{n}',
                  String(Math.min(remaining, PROJECTS_PAGE_SIZE))
                )}
              </button>
            </div>
          )}
        </>
      )}

      {showModal && <NewProjectModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default ProjectsPage;
