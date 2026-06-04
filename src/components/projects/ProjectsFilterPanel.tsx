import { useState } from 'react';
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from 'lucide-react';
import {
  MemberSizeFilter,
  ProjectFilterOptions,
  ProjectListFilters,
  VisibilityFilter,
  countActiveProjectFilters,
} from '../../lib/projectFilters';
import { ProjectStatus } from '../../types';
import strings from '../ui/strings';
import './ProjectsFilterPanel.css';

interface ProjectsFilterPanelProps {
  filters: ProjectListFilters;
  options: ProjectFilterOptions;
  sortBy: 'updated' | 'created' | 'title';
  onSortChange: (value: 'updated' | 'created' | 'title') => void;
  onChange: (patch: Partial<ProjectListFilters>) => void;
  onClear: () => void;
}

function FilterChip({
  active,
  label,
  onClick,
  color,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      className={`projects-filter-chip ${active ? 'projects-filter-chip--active' : ''}`}
      onClick={onClick}
      style={active && color ? { borderColor: color, color, background: `${color}18` } : undefined}
    >
      {label}
    </button>
  );
}

const ProjectsFilterPanel: React.FC<ProjectsFilterPanelProps> = ({
  filters,
  options,
  sortBy,
  onSortChange,
  onChange,
  onClear,
}) => {
  const [expanded, setExpanded] = useState(false);

  const activeCount = countActiveProjectFilters(filters);

  const toggleTech = (id: string) => {
    const next = filters.technologyIds.includes(id)
      ? filters.technologyIds.filter(t => t !== id)
      : [...filters.technologyIds, id];
    onChange({ technologyIds: next });
  };

  const statusEntries = Object.entries(strings.projects.status) as [ProjectStatus, string][];

  const memberSizes: { id: MemberSizeFilter; label: string }[] = [
    { id: 'any', label: strings.projects.filters.memberAny },
    { id: '1-2', label: strings.projects.filters.memberSmall },
    { id: '3-5', label: strings.projects.filters.memberMedium },
    { id: '6-10', label: strings.projects.filters.memberLarge },
    { id: '11+', label: strings.projects.filters.memberXLarge },
  ];

  return (
    <section className="projects-filter-panel">
      <div className="projects-filter-panel-header">
        <button
          type="button"
          className="projects-filter-panel-toggle"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
        >
          <SlidersHorizontal size={15} />
          <span>{strings.projects.filters.title}</span>
          {activeCount > 0 && (
            <span className="projects-filter-active-badge">{activeCount}</span>
          )}
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        <div className="projects-filter-panel-actions">
          {activeCount > 0 && (
            <button type="button" className="projects-filter-clear" onClick={onClear}>
              <X size={12} />
              {strings.projects.filters.clearAll}
            </button>
          )}
          <label className="projects-filter-sort">
            <span className="projects-filter-sort-label">{strings.projects.sortBy}</span>
            <select
              className="filter-select"
              value={sortBy}
              onChange={e => onSortChange(e.target.value as typeof sortBy)}
            >
              <option value="updated">{strings.projects.filters.sortUpdated}</option>
              <option value="created">{strings.projects.filters.sortCreated}</option>
              <option value="title">{strings.projects.filters.sortTitle}</option>
            </select>
          </label>
        </div>
      </div>

      {expanded && (
        <div className="projects-filter-panel-body">
          <div className="projects-filter-group">
            <span className="projects-filter-label">{strings.projects.filters.status}</span>
            <div className="projects-filter-chips">
              <FilterChip
                active={filters.status === 'all'}
                label={strings.projects.allStatuses}
                onClick={() => onChange({ status: 'all' })}
              />
              {statusEntries.map(([key, label]) => (
                <FilterChip
                  key={key}
                  active={filters.status === key}
                  label={label}
                  onClick={() => onChange({ status: key })}
                />
              ))}
            </div>
          </div>

          <div className="projects-filter-row">
            <div className="projects-filter-group">
              <span className="projects-filter-label">{strings.projects.filters.semester}</span>
              <div className="projects-filter-chips">
                <FilterChip
                  active={filters.semester === 'all'}
                  label={strings.projects.filters.any}
                  onClick={() => onChange({ semester: 'all' })}
                />
                {options.semesters.map(sem => (
                  <FilterChip
                    key={sem}
                    active={filters.semester === sem}
                    label={sem}
                    onClick={() => onChange({ semester: sem })}
                  />
                ))}
              </div>
            </div>

            <div className="projects-filter-group">
              <span className="projects-filter-label">{strings.projects.filters.year}</span>
              <div className="projects-filter-chips">
                <FilterChip
                  active={filters.year === 'all'}
                  label={strings.projects.filters.any}
                  onClick={() => onChange({ year: 'all' })}
                />
                {options.years.map(year => (
                  <FilterChip
                    key={year}
                    active={filters.year === year}
                    label={String(year)}
                    onClick={() => onChange({ year })}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="projects-filter-row">
            <div className="projects-filter-group">
              <span className="projects-filter-label">{strings.projects.filters.teamSize}</span>
              <div className="projects-filter-chips">
                {memberSizes.map(({ id, label }) => (
                  <FilterChip
                    key={id}
                    active={filters.memberSize === id}
                    label={label}
                    onClick={() => onChange({ memberSize: id })}
                  />
                ))}
              </div>
            </div>

            <div className="projects-filter-group">
              <span className="projects-filter-label">{strings.projects.filters.visibility}</span>
              <div className="projects-filter-chips">
                {([
                  ['any', strings.projects.filters.any],
                  ['public', strings.projects.public],
                  ['private', strings.projects.private],
                ] as [VisibilityFilter, string][]).map(([id, label]) => (
                  <FilterChip
                    key={id}
                    active={filters.visibility === id}
                    label={label}
                    onClick={() => onChange({ visibility: id })}
                  />
                ))}
              </div>
            </div>
          </div>

          {options.technologies.length > 0 && (
            <div className="projects-filter-group">
              <span className="projects-filter-label">{strings.projects.filters.technologies}</span>
              <p className="projects-filter-hint">{strings.projects.filters.techHint}</p>
              <div className="projects-filter-chips projects-filter-chips--tech">
                {options.technologies.map(tech => (
                  <FilterChip
                    key={tech.id}
                    active={filters.technologyIds.includes(tech.id)}
                    label={tech.name}
                    color={tech.color}
                    onClick={() => toggleTech(tech.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default ProjectsFilterPanel;
