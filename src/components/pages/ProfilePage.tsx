import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ExternalLink, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Role, User } from '../../types';
import Badge from '../ui/Badge';
import strings from '../ui/strings';
import './ProfilePage.css';

const roleVariant: Record<Role, 'default' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  student: 'default',
  coordinator: 'success',
  admin: 'danger',
  guest: 'neutral',
};

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      setNotFound(false);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, role, student_id, avatar')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) {
        setProfile(null);
        setNotFound(true);
      } else {
        setProfile({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role as Role,
          studentId: data.student_id ?? undefined,
          avatar: data.avatar ?? undefined,
        });
      }
      setLoading(false);
    };
    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="profile-page">
        <p className="profile-muted">{strings.profile.loading}</p>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="profile-page">
        <div className="profile-not-found">
          <h2>{strings.profile.notFoundTitle}</h2>
          <p>{strings.profile.notFoundHint}</p>
          <button type="button" className="btn-primary" onClick={() => navigate(-1)}>
            {strings.profile.goBack}
          </button>
        </div>
      </div>
    );
  }

  const isSelf = currentUser?.id === profile.id;

  return (
    <div className="profile-page">
      <button type="button" className="profile-back" onClick={() => navigate(-1)}>
        <ChevronLeft size={14} /> {strings.profile.goBack}
      </button>

      <div className="profile-mockup-banner">
        <Info size={16} className="profile-mockup-icon" aria-hidden />
        <div>
          <p className="profile-mockup-title">{strings.profile.mockupTitle}</p>
          <p className="profile-mockup-text">{strings.profile.mockupBody}</p>
        </div>
      </div>

      <header className="profile-header">
        <div className="profile-avatar">{profile.name.charAt(0).toUpperCase()}</div>
        <div className="profile-header-text">
          <h1 className="profile-name">
            {profile.name}
            {isSelf && <span className="profile-you">{strings.profile.you}</span>}
          </h1>
          <p className="profile-email">{profile.email}</p>
          <Badge label={strings.roles[profile.role]} variant={roleVariant[profile.role]} size="md" />
        </div>
      </header>

      <section className="profile-card">
        <h2 className="profile-section-title">{strings.profile.details}</h2>
        <dl className="profile-details">
          <div className="profile-detail-row">
            <dt>{strings.profile.studentId}</dt>
            <dd>{profile.studentId ?? '—'}</dd>
          </div>
          <div className="profile-detail-row">
            <dt>{strings.profile.role}</dt>
            <dd>{strings.roles[profile.role]}</dd>
          </div>
          <div className="profile-detail-row">
            <dt>{strings.profile.email}</dt>
            <dd>{profile.email}</dd>
          </div>
        </dl>
      </section>

      <section className="profile-card profile-integrations">
        <h2 className="profile-section-title">{strings.profile.integrations}</h2>
        <p className="profile-integration-desc">{strings.profile.eportfolioHint}</p>
        <button type="button" className="btn-secondary profile-eportfolio-btn" disabled title={strings.profile.eportfolioDisabledTitle}>
          <ExternalLink size={14} />
          {strings.profile.eportfolioButton}
        </button>
        <p className="profile-integration-note">{strings.profile.eportfolioNote}</p>
      </section>

      <p className="profile-footer-hint">
        {strings.profile.footerHint}{' '}
        <Link to="/projects">{strings.navbar.projects}</Link>
        {' · '}
        <Link to="/team">{strings.navbar.team}</Link>
      </p>
    </div>
  );
};

export default ProfilePage;
