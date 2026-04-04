import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { TechnologyProvider } from './context/TechnologyContext';
import { TeamProvider } from './context/TeamContext';
import { InviteProvider } from './context/InviteContext';
import Layout from './components/layout/Layout';
import LoginPage from './components/pages/LoginPage';
import BrowsePage from './components/pages/BrowsePage';
import DashboardPage from './components/pages/DashboardPage';
import ProjectsPage from './components/pages/ProjectsPage';
import ProjectDetailPage from './components/pages/ProjectDetailPage';
import KanbanPage from './components/pages/KanbanPage';
import TeamPage from './components/pages/TeamPage';
import './App.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      {/* Public routes — no auth required */}
      <Route path="/login"  element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/browse" element={<BrowsePage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/"             element={<DashboardPage />} />
        <Route path="/projects"     element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/kanban"       element={<KanbanPage />} />
        <Route path="/team"         element={<TeamPage />} />
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
