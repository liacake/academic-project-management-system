import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { TechnologyProvider } from './context/TechnologyContext';
import { TeamProvider } from './context/TeamContext';
import { InviteProvider } from './context/InviteContext';
import Layout from './components/layout/Layout';
import LoginPage from './components/pages/LoginPage';
import BrowsePage from './components/pages/BrowsePage';
import PublicProjectDetailPage from './components/pages/PublicProjectDetailPage';
import DashboardPage from './components/pages/DashboardPage';
import ProjectsPage from './components/pages/ProjectsPage';
import ProjectDetailPage from './components/pages/ProjectDetailPage';
import KanbanPage from './components/pages/KanbanPage';
import TeamPage from './components/pages/TeamPage';
import TasksPage from './components/pages/TasksPage';
import AdminPage from './components/pages/AdminPage';
import TechnologiesAdminPage from './components/pages/TechnologiesAdminPage';
import ProfilePage from './components/pages/ProfilePage';
import './App.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'guest') return <Navigate to="/browse" replace />;
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hasRole } = useAuth();
  if (!hasRole('admin')) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      {/* Public routes — no auth required */}
      <Route path="/login"  element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/browse" element={<BrowsePage />} />
      <Route path="/browse/:id" element={<PublicProjectDetailPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/"             element={<DashboardPage />} />
        <Route path="/projects"     element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/kanban"       element={<KanbanPage />} />
        <Route path="/tasks"        element={<TasksPage />} />
        <Route path="/team"         element={<TeamPage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/admin"                 element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="/admin/technologies"    element={<AdminRoute><TechnologiesAdminPage /></AdminRoute>} />
      </Route>

      {/* Fallback: guests go to browse, authenticated users go home */}
      <Route path="*" element={isAuthenticated ? <Navigate to="/" replace /> : <Navigate to="/browse" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <TechnologyProvider>
            <TeamProvider>
              <InviteProvider>
                <AppRoutes />
              </InviteProvider>
            </TeamProvider>
          </TechnologyProvider>
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
