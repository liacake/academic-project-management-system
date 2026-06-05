import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ThemePreference } from '../../lib/theme';
import strings from './strings';
import './ThemeToggle.css';

const LABELS: Record<ThemePreference, string> = {
  system: strings.theme.system,
  light: strings.theme.light,
  dark: strings.theme.dark,
};

const ICONS: Record<ThemePreference, typeof Sun> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { preference, cyclePreference } = useTheme();
  const Icon = ICONS[preference];

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={cyclePreference}
      title={LABELS[preference]}
      aria-label={`${strings.theme.switch}: ${LABELS[preference]}`}
    >
      <Icon size={15} strokeWidth={2} aria-hidden />
    </button>
  );
};

export default ThemeToggle;
