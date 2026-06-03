import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Github, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Badge from '../ui/Badge';
import strings from '../ui/strings';
import './PublicProjectDetailPage.css';

interface PublicProjectDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  semester?: string;
  year?: number;
  repositoryUrl?: string;
  demoUrl?: string;
  technologies: { name: string; color: string; category: string }[];
  memberCount: number;
  taskCount: number;
  completedTasks: number;
}

const statusVariant: Record<string, 'success' | 'default' | 'neutral' | 'warning'> = {
  active: 'success', planning: 'warning', completed: 'default', archived: 'neutral',
};

const PublicProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<PublicProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchProject = async () => {
      setLoading(true);
      setNotFound(false);

      const { data, error } = await supabase
        .from('projects')
        .select(`id, title, description, status, semester, year, repository_url, demo_url,
          project_technologies(technologies(name, color, category)),
          project_members(user_id),
          tasks(id, status)`)
        .eq('id', id)
        .eq('is_public', true)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
        setProject(null);
      } else {
        const p = data as Record<string, unknown>;
        const tasks = (p.tasks as Array<{ status: string }>) ?? [];
        setProject({
          id: p.id as string,
          title: p.title as string,
          description: p.description as string,
          status: p.status as string,
          semester: (p.semester ?? undefined) as string | undefined,
          year: (p.year ?? undefined) as number | undefined,
          repositoryUrl: (p.repository_url ?? undefined) as string | undefined,
          demoUrl: (p.demo_url ?? undefined) as string | undefined,
          technologies: ((p.project_technologies as Array<Record<string, unknown>>) ?? [])
            .map(r => {
              const t = r.technologies as Record<string, unknown>;
              return {
                name: t.name as string,
                color: t.color as string,
                category: t.category as string,
              };
            }),
          memberCount: ((p.project_members as unknown[]) ?? []).length,
          taskCount: tasks.length,
          completedTasks: tasks.filter(t => t.status === 'done').length,
        });
      }
      setLoading(false);
    };
    fetchProject();
  }, [id]);

  if (loading) {
    return (
      <div className="public-detail-page">
        <p className="public-detail-loading">{strings.browse.loadingProject}</p>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="public-detail-page">
        <div className="public-detail-not-found">
          <h2>{strings.browse.notFoundTitle}</h2>
          <p>{strings.browse.notFoundHint}</p>
          <button type="button" className="btn-primary" onClick={() => navigate('/browse')}>
            {strings.browse.backToBrowse}
          </button>
        </div>
      </div>
    );
  }

  const progress = project.taskCount > 0
    ? Math.round((project.completedTasks / project.taskCount) * 100)
    : 0;

  return (
    <div className="public-detail-page">
      <header className="public-detail-header">
        <Link to="/browse" className="public-detail-brand">
          <div className="public-detail-logo">A</div>
          <div>
            <span className="public-detail-app">{strings.appName}</span>
            <span className="public-detail-tagline">{strings.tagline}</span>
          </div>
        </Link>
        <button type="button" className="btn-primary" onClick={() => navigate('/login')}>
          {strings.browse.signInCta}
        </button>
      </header>

      <button type="button" className="public-detail-back" onClick={() => navigate('/browse')}>
        <ChevronLeft size={14} /> {strings.browse.backToProjects}
      </button>

      <div className="public-detail-meta">
        <Badge label={strings.projects.status[project.status as keyof typeof strings.projects.status] ?? project.status} variant={statusVariant[project.status] ?? 'default'} size="md" />
        <Badge label={strings.projects.public} variant="neutral" size="md" />
        {project.semester && project.year && (
          <span className="public-detail-semester">{project.semester} {project.year}</span>
        )}
      </div>

      <h1 className="public-detail-title">{project.title}</h1>
      <p className="public-detail-desc">{project.description}</p>

      <div className="public-detail-actions">
        {project.repositoryUrl && (
          <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
            <Github size={14} /> {strings.projects.repository}
          </a>
        )}
        {project.demoUrl && (
          <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
            <ExternalLink size={14} /> {strings.projects.demo}
          </a>
        )}
      </div>

      <section className="public-detail-section">
        <h2>{strings.browse.technologies}</h2>
        {project.technologies.length === 0 ? (
          <p className="public-detail-muted">{strings.browse.noTechnologies}</p>
        ) : (
          <div className="public-detail-techs">
            {project.technologies.map(t => (
              <div key={t.name} className="public-detail-tech" style={{ borderColor: `${t.color}44` }}>
                <span className="public-detail-tech-dot" style={{ background: t.color }} />
                <span>{t.name}</span>
                <span className="public-detail-tech-cat">{t.category}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="public-detail-section public-detail-stats">
        <div className="public-detail-stat">
          <span className="public-detail-stat-value">{project.memberCount}</span>
          <span className="public-detail-stat-label">{strings.browse.teamMembers}</span>
        </div>
        {project.taskCount > 0 && (
          <div className="public-detail-stat">
            <span className="public-detail-stat-value">{progress}%</span>
            <span className="public-detail-stat-label">
              {strings.browse.tasksComplete} ({project.completedTasks}/{project.taskCount})
            </span>
          </div>
        )}
      </section>

      <footer className="public-detail-footer">
        <p>
          {strings.browse.manageFooter}{' '}
          <button type="button" className="browse-link" onClick={() => navigate('/login')}>
            {strings.browse.signInOrCreate}
          </button>
        </p>
      </footer>
    </div>
  );
};

export default PublicProjectDetailPage;
