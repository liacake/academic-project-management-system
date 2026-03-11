import { Github, ExternalLink } from 'lucide-react';
import { Project } from '../../types';
import Badge from './Badge';
import './ProjectCard.css';
import strings from './strings';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

const statusVariant: Record<string, 'success' | 'default' | 'neutral' | 'warning'> = {
  active: 'success', planning: 'warning', completed: 'default', archived: 'neutral',
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const completedTasks = project.tasks.filter(t => t.status === 'done').length;
  const totalTasks = project.tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="project-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}>
      <div className="project-card-header">
        <div className="project-card-meta">
          <Badge label={strings.projects.status[project.status]} variant={statusVariant[project.status]} />
          <Badge label={project.isPublic ? strings.projects.public : strings.projects.private} variant="neutral" />
        </div>
        <div className="project-card-semester">
          {project.semester && project.year ? `${project.semester} ${project.year}` : ''}
        </div>
      </div>

      <h3 className="project-card-title">{project.title}</h3>
      <p className="project-card-desc">{project.description}</p>

      <div className="project-card-tech">
        {project.technologies.slice(0, 4).map(tech => (
          <Badge key={tech.id} label={tech.name} color={tech.color} />
        ))}
        {project.technologies.length > 4 && (
          <span className="tech-more">+{project.technologies.length - 4}</span>
        )}
      </div>

      {totalTasks > 0 && (
        <div className="project-card-progress">
          <div className="progress-header">
            <span>Tasks</span>
            <span>{completedTasks}/{totalTasks}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="project-card-footer">
        <div className="project-card-members">
          {project.members.slice(0, 3).map((member, idx) => (
            <div key={member.id} className="member-avatar" style={{ zIndex: 3 - idx }} title={member.name}>
              {member.name.charAt(0)}
            </div>
          ))}
          {project.members.length > 3 && (
            <div className="member-avatar member-avatar--more">+{project.members.length - 3}</div>
          )}
        </div>
        <div className="project-card-links">
          {project.repositoryUrl && (
            <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()} className="project-link">
              <Github size={12} /> Repo
            </a>
          )}
          {project.demoUrl && (
            <a href={project.demoUrl} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()} className="project-link">
              <ExternalLink size={12} /> Demo
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
