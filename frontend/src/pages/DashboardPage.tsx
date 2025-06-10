import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { RoleBasedAccess, AdminOnly, ApproverAccess, DataEntryAccess } from '../components/RoleBasedAccess';
import { Navigation } from '../components/Navigation';

export function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
  totalMembers: 0,
  pendingApprovals: 0,
  todayCheckins: 0
  });

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setIsLoading(false);
     // Fetch dashboard stats
      fetchDashboardStats();
    } catch (error) {
      toast.error('Session invalid, please login again');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  }, [navigate]);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/members');
      const members = response.data;
      setStats({
        totalMembers: members.length,
        pendingApprovals: members.filter((m: any) => m.status === 'pending').length,
        todayCheckins: 0 // Will implement later with events
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="Membership System" />
      <main className="p-6">
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Total Members</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalMembers}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Pending Approvals</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendingApprovals}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Today's Check-ins</h3>
            <p className="text-3xl font-bold text-green-600">{stats.todayCheckins}</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RoleBasedAccess roles={['admin', 'data-entry']}>
          <button 
              onClick={() => navigate('/members/new')}
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-left"
          >
             <h3 className="text-lg font-semibold mb-2">Add New Member</h3>
             <p className="text-gray-600">Register a new member</p>
          </button>
        </RoleBasedAccess>
        <RoleBasedAccess roles={['admin', 'editor', 'printer']}>
          <button 
           onClick={() => navigate('/members')}
           className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-left"
          >
            <h3 className="text-lg font-semibold mb-2">Manage Members</h3>
            <p className="text-gray-600">View and edit members</p>
          </button>
        </RoleBasedAccess>
        <AdminOnly>
          <button 
            onClick={() => navigate('/events')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-left"
          >
            <h3 className="text-lg font-semibold mb-2">Events</h3>
            <p className="text-gray-600">Manage events and check-ins</p>
          </button>
        </AdminOnly>
          <ApproverAccess>
          <button 
            onClick={() => navigate('/approvals')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-left"
          >
            <h3 className="text-lg font-semibold mb-2">Pending Approvals</h3>
            <p className="text-gray-600">Review and approve new members</p>
            {stats.pendingApprovals > 0 && (
              <span className="mt-2 inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                {stats.pendingApprovals} pending
              </span>
           )}
          </button>
         </ApproverAccess>
        </div>
      </main>
    </div>
  );
}
