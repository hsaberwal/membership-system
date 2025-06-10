import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { Navigation } from '../components/Navigation';

interface PendingMember {
  id: string;
  member_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  membership_type_name: string;
  id_document_type: string;
  id_document_number: string;
  address_line1: string;
  city: string;
  postal_code: string;
  photo_url: string;
  aml_check_status?: string;
  aml_check_date?: string;
  created_at: string;
}

export function ApprovalPage() {
  const navigate = useNavigate();
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<PendingMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    // Check if user has permission
    if (user.role !== 'admin' && user.role !== 'approver') {
      toast.error('You do not have permission to access this page');
      navigate('/dashboard');
      return;
    }
    fetchPendingMembers();
  }, []);

  const fetchPendingMembers = async () => {
    try {
      const response = await api.get('/members');
      const pending = response.data.filter((m: any) => m.status === 'pending');
      setPendingMembers(pending);
    } catch (error) {
      toast.error('Failed to fetch pending members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (memberId: string) => {
    setActionLoading(true);
    try {
      await api.put(`/members/${memberId}/approve`);
      toast.success('Member approved successfully');
      setSelectedMember(null);
      fetchPendingMembers();
    } catch (error) {
      toast.error('Failed to approve member');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (memberId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    setActionLoading(true);
    try {
      await api.put(`/members/${memberId}/reject`, { reason });
      toast.success('Member rejected');
      setSelectedMember(null);
      fetchPendingMembers();
    } catch (error) {
      toast.error('Failed to reject member');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="Member Approvals" />
      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Members List */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Pending Members ({pendingMembers.length})</h2>
              {isLoading ? (
                <p className="text-gray-500">Loading...</p>
              ) : pendingMembers.length === 0 ? (
                <p className="text-gray-500">No pending approvals</p>
              ) : (
                <div className="space-y-2">
                  {pendingMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedMember?.id === member.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <p className="font-medium">{member.first_name} {member.last_name}</p>
                      <p className="text-sm text-gray-500">{member.membership_type_name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(member.created_at).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Member Details */}
          <div className="lg:col-span-2">
            {selectedMember ? (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Member Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Photo */}
                  <div className="md:col-span-2">
                    <img 
                      src={selectedMember.photo_url} 
                      alt="Member" 
                      className="w-48 h-48 object-cover rounded-lg mx-auto"
                    />
                  </div>

                  {/* Personal Info */}
                  <div>
                    <h3 className="font-semibold mb-2">Personal Information</h3>
                    <dl className="space-y-1 text-sm">
                      <div>
                        <dt className="text-gray-500">Name:</dt>
                        <dd className="font-medium">{selectedMember.first_name} {selectedMember.last_name}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Date of Birth:</dt>
                        <dd>{new Date(selectedMember.date_of_birth).toLocaleDateString()}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Member Number:</dt>
                        <dd>{selectedMember.member_number}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Membership Type:</dt>
                        <dd>{selectedMember.membership_type_name}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* ID & Address */}
                  <div>
                    <h3 className="font-semibold mb-2">ID & Address</h3>
                    <dl className="space-y-1 text-sm">
                      <div>
                        <dt className="text-gray-500">ID Type:</dt>
                        <dd>{selectedMember.id_document_type.replace('_', ' ')}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">ID Number:</dt>
                        <dd>{selectedMember.id_document_number}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Address:</dt>
                        <dd>
                          {selectedMember.address_line1}<br />
                          {selectedMember.city}, {selectedMember.postal_code}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
                {/* AML Check Status */}
                <div className="md:col-span-2 mt-4">
                  <h3 className="font-semibold mb-2">AML Check Status</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dl className="space-y-1 text-sm">
                      <div>
                        <dt className="text-gray-500">Status:</dt>
                        <dd className="font-medium">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            selectedMember.aml_check_status === 'clear' ? 'bg-green-100 text-green-800' :
                            selectedMember.aml_check_status === 'match' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedMember.aml_check_status || 'Not checked'}
                          </span>
                        </dd>
                      </div>
                      {selectedMember.aml_check_date && (
                        <div>
                          <dt className="text-gray-500">Checked on:</dt>
                          <dd>{new Date(selectedMember.aml_check_date).toLocaleString()}</dd>
                        </div>
                      )}
                      {selectedMember.aml_check_status === 'match' && (
                        <div className="mt-2 p-2 bg-red-50 rounded">
                          <p className="text-sm text-red-800">
                            ⚠️ This member has potential AML matches. Please review carefully before approval.
                          </p>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    onClick={() => handleReject(selectedMember.id)}
                    disabled={actionLoading}
                    className="btn btn-secondary"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedMember.id)}
                    disabled={actionLoading}
                    className="btn btn-primary"
                  >
                    {actionLoading ? 'Processing...' : 'Approve Member'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
                Select a member to view details
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
