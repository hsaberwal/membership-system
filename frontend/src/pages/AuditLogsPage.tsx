import { useState, useEffect } from 'react';
import { Navigation } from '../components/Navigation';
import { AdminOnly } from '../components/RoleBasedAccess';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface AuditLog {
  id: string;
  user_id: string;
  username?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  ip_address?: string;
  created_at: string;
}

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/audit-logs');
      setLogs(response.data);
    } catch (error) {
      toast.error('Failed to fetch audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminOnly>
      <div className="min-h-screen bg-gray-50">
        <Navigation title="Audit Logs" />
        
        <main className="p-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">System Audit Logs</h2>
            </div>
            
            {isLoading ? (
              <div className="p-12 text-center">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-6 py-4 text-sm">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm">{log.username || 'Unknown'}</td>
                        <td className="px-6 py-4 text-sm font-medium">{log.action}</td>
                        <td className="px-6 py-4 text-sm">{log.entity_type}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{log.ip_address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </AdminOnly>
  );
}
