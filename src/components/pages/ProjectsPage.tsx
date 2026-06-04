import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { canCreateProjects, canViewAllProjects } from '../../lib/permissions';
import {
  EMPTY_PROJECT_FILTERS,
  PROJECTS_PAGE_SIZE,
  applyProjectListFilters,
  buildProjectFilterOptions,
  filterProjectsForRole,
  showMyProjectsFilter,
  sortProjects,
} from '../../lib/projectFilters';
import { ProjectStatus } from '../../types';
import ProjectCard from '../ui/ProjectCard';
import ProjectsFilterPanel from '../projects/ProjectsFilterPanel';
import strings from '../ui/strings';
import NewProjectModal from '../modals/NewProjectModal';
import './ProjectsPage.css';
import '../projects/ProjectsFilterPanel.css';

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
  const [filters, setFilters] = useState({ ...EMPTY_PROJECT_FILTERS });

  const statusFromUrl = useMemo((): ProjectStatus | 'all' => {
    const param = searchParams.get('status');
    if (param && param in strings.projects.status) return param as ProjectStatus;
    return 'all';
  }, [searchParams]);

  const activeFilters = useMemo(
    () => ({ ...filters, search, status: statusFromUrl }),
    [filters, search, statusFromUrl]
  );

  const scopeFiltered = useMemo(
    () => filterProjectsForRole(projects, user, showScopeFilter && myProjectsOnly),
    [projects, user, showScopeFilter, myProjectsOnly]
  );

  const filterOptions = useMemo(
    () => buildProjectFilterOptions(scopeFiltered),
    [scopeFiltered]
  );

  const filtered = useMemo(() => {
    const list = applyProjectListFilters(scopeFiltered, activeFilters);
    return sortProjects(list, sortBy);
  }, [scopeFiltered, activeFilters, sortBy]);

  useEffect(() => {
    setVisibleCount(PROJECTS_PAGE_SIZE);
  }, [activeFilters, sortBy, myProjectsOnly]);

  const visibleProjects = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visibleProjects.length;
  const hasMore = remaining > 0;

  const scopeFilterLabel = user?.role === 'coordinator'
    ? strings.projects.filterMyCoordinate
    : strings.projects.filterMyMember;

  const subtitle = strings.projects.showingCount
    .replace('{shown}', String(visibleProjects.length))
    .replace('{total}', String(filtered.length));

  const patchFilters = (patch: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...patch }));
    if (patch.status !== undefined) {
      const next = new URLSearchParams(searchParams);
      if (patch.status === 'all') next.delete('status');
      else next.set('status', patch.status);
      setSearchParams(next, { replace: true });
    }
  };

  const clearAllFilters = () => {
    setFilters({ ...EMPTY_PROJECT_FILTERS });
    setSearch('');
    const next = new URLSearchParams(searchParams);
    next.delete('status');
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="projects-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{strings.projects.title}</h1>
          <p className="page-subtitle">
            {overviewMode ? `${strings.projects.subtitleOverview} · ${subtitle}` : subtitle}
          </p>
        </div>
        {showCreate && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + {strings.projects.new}
          </button>
        )}
      </div>

      <div className="projects-search-row">
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
      </div>

      <ProjectsFilterPanel
        filters={activeFilters}
        options={filterOptions}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onChange={patchFilters}
        onClear={clearAllFilters}
      />

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
                className="projects-show-more-btn"
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
