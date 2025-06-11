import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MembersPage } from './pages/MembersPage';
import { AddMemberPage } from './pages/AddMemberPage';
import { ApprovalPage } from './pages/ApprovalPage';
import { CardDesignerPage } from './pages/CardDesignerPage';
import { PrintCardsPage } from './pages/PrintCardsPage';
import { EventsPage } from './pages/EventsPage';
import { EventCheckInPage } from './pages/EventCheckInPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { MemberDetailPage } from './pages/MemberDetailPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/members/new" element={<AddMemberPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/approvals" element={<ApprovalPage />} />
            <Route path="/card-designer" element={<CardDesignerPage />} />
            <Route path="/print" element={<PrintCardsPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id/checkin" element={<EventCheckInPage />} />
            <Route path="/users" element={<UserManagementPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/members/:id" element={<MemberDetailPage />} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
