import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useSession } from './lib/auth-client';
import LoginPage from './pages/LoginPage';
import WorkspacePage from './pages/WorkspacePage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  if (isPending) return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-6 w-6 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
    </div>
  );
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-base">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}
