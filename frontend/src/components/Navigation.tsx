import { useNavigate } from 'react-router-dom';
import { RoleBasedAccess } from './RoleBasedAccess';

interface NavigationProps {
  title: string;
}

export function Navigation({ title }: NavigationProps) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      roles: ['admin', 'data-entry', 'printer', 'editor', 'approver']
    },
    {
      label: 'Add Member',
      path: '/members/new',
      roles: ['admin', 'data-entry']
    },
    {
      label: 'Members',
      path: '/members',
      roles: ['admin', 'editor', 'printer']
    },
    {
      label: 'Approvals',
      path: '/approvals',
      roles: ['admin', 'approver']
    },
    {
      label: 'Print Cards',
      path: '/print',
      roles: ['admin', 'printer']
    },
    {
      label: 'Card Designer',
      path: '/card-designer',
      roles: ['admin']
    },
    {
      label: 'Events',
      path: '/events',
      roles: ['admin']
    },
    {
      label: 'Users',
      path: '/users',
      roles: ['admin']
    },
    {
      label: 'Audit Logs',
      path: '/audit-logs',
      roles: ['admin']
    },
  ];

  return (
    <nav className="bg-white shadow">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-semibold">{title}</h1>
            <div className="hidden md:flex space-x-4">
              {menuItems.map((item) => (
                <RoleBasedAccess key={item.path} roles={item.roles}>
                  <button
                    onClick={() => navigate(item.path)}
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    {item.label}
                  </button>
                </RoleBasedAccess>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{user.username}</span>
            <span className="text-sm text-gray-500">({user.role})</span>
            <button
              onClick={handleLogout}
              className="btn btn-secondary text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
