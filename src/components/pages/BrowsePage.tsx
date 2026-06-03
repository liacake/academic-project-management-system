import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Badge from '../ui/Badge';
import strings from '../ui/strings';
import './BrowsePage.css';

interface PublicProject {
  id: string;
  title: string;
  description: string;
  status: string;
  semester?: string;
  year?: number;
  technologies: { name: string; color: string }[];
  memberCount: number;
}

const statusVariant: Record<string, 'success' | 'default' | 'neutral' | 'warning'> = {
  active: 'success', planning: 'warning', completed: 'default', archived: 'neutral',
};

const BrowsePage: React.FC = () => {
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPublic = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('projects')
        .select(`id, title, description, status, semester, year,
          project_technologies(technologies(name, color)),
          project_members(count)`)
        .eq('is_public', true)
        .order('updated_at', { ascending: false });

      setProjects(
        (data ?? []).map((p: Record<string, unknown>) => ({
          id: p.id as string,
          title: p.title as string,
          description: p.description as string,
          status: p.status as string,
          semester: (p.semester ?? undefined) as string | undefined,
          year: (p.year ?? undefined) as number | undefined,
          technologies: ((p.project_technologies as Array<Record<string, unknown>>) ?? [])
            .map(r => {
              const t = r.technologies as Record<string, unknown>;
              return { name: t.name as string, color: t.color as string };
            }),
          memberCount: ((p.project_members as Array<Record<string, unknown>>) ?? []).length,
        }))
      );
      setLoading(false);
    };
    fetchPublic();
  }, []);

  const filtered = projects.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase()) ||
    p.technologies.some(t => t.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="browse-page">
      <div className="browse-header">
        <div className="browse-brand">
          <div className="browse-logo">A</div>
          <div>
            <h1 className="browse-title">{strings.browse.title}</h1>
            <p className="browse-subtitle">{strings.browse.subtitle}</p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => navigate('/login')}>{strings.browse.signInCta}</button>
      </div>

      <div className="browse-search-wrap">
        <Search size={14} className="browse-search-icon" />
        <input
          className="browse-search-input"
          type="text"
          placeholder={strings.browse.searchPlaceholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && <button className="browse-search-clear" onClick={() => setSearch('')}><X size={12} /></button>}
      </div>

      {loading ? (
        <div className="browse-loading">{strings.browse.loading}</div>
      ) : filtered.length === 0 ? (
        <div className="browse-empty">{strings.browse.empty}</div>
      ) : (
        <div className="browse-grid">
          {filtered.map(p => (
            <div key={p.id} className="browse-card" onClick={() => navigate(`/browse/${p.id}`)}>
              <div className="browse-card-top">
                <span className="browse-card-title">{p.title}</span>
                <Badge label={p.status} variant={statusVariant[p.status] ?? 'default'} />
              </div>
              <p className="browse-card-desc">{p.description}</p>
              <div className="browse-card-techs">
                {p.technologies.slice(0, 5).map(t => (
                  <span key={t.name} className="browse-tech-chip" style={{ borderColor: `${t.color}55`, color: t.color }}>
                    {t.name}
                  </span>
                ))}
                {p.technologies.length > 5 && (
                  <span className="browse-tech-more">+{p.technologies.length - 5}</span>
                )}
              </div>
              <div className="browse-card-footer">
                <span className="browse-card-meta">
                  {p.memberCount} {p.memberCount !== 1 ? strings.browse.members : strings.browse.member}
                </span>
                {p.semester && p.year && <span className="browse-card-meta">{p.semester} {p.year}</span>}
                <span className="browse-card-cta">{strings.browse.viewDetailsCta}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="browse-footer">
        <p>
          {strings.browse.footer}{' '}
          <button type="button" className="browse-link" onClick={() => navigate('/login')}>
            {strings.browse.createAccount}
          </button>
        </p>
      </div>
    </div>
  );
};

export default BrowsePage;
