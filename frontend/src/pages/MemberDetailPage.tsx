import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { Navigation } from '../components/Navigation';
import type { Member, MembershipType } from '../types/index.js';

export function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [membershipType, setMembershipType] = useState<MembershipType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Get user role from JWT or your auth context
  const userRole = localStorage.getItem('userRole') || 'viewer';

  useEffect(() => {
    if (id) {
      fetchMemberDetails();
    }
  }, [id]);

  const fetchMemberDetails = async () => {
    try {
      setIsLoading(true);
      const memberResponse = await api.get(`/members/${id}`);
      setMember(memberResponse.data);
      
      // Fetch membership type details
      if (memberResponse.data.membership_type_id) {
        const typeResponse = await api.get(`/membership-types/${memberResponse.data.membership_type_id}`);
        setMembershipType(typeResponse.data);
      }
    } catch (error) {
      toast.error('Failed to fetch member details');
      navigate('/members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await api.put(`/members/${id}/approve`);
      toast.success('Member approved successfully');
      fetchMemberDetails();
    } catch (error) {
      toast.error('Failed to approve member');
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      await api.put(`/members/${id}/reject`, { reason });
      toast.success('Member rejected');
      fetchMemberDetails();
    } catch (error) {
      toast.error('Failed to reject member');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/members/${id}`);
      toast.success('Member deleted successfully');
      navigate('/members');
    } catch (error) {
      toast.error('Failed to delete member');
    }
  };

  const handlePrintCard = () => {
    navigate(`/members/${id}/print-card`);
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusClasses[status as keyof typeof statusClasses]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation title="Member Details" />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation title="Member Details" />
        <div className="text-center py-12">
          <p className="text-gray-500">Member not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="Member Details" />
      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-6">
                {/* Member Photo */}
                <div className="flex-shrink-0">
                  {member.photo_url ? (
                    <img
                      className="h-32 w-32 rounded-full object-cover border-4 border-gray-200"
                      src={member.photo_url}
                      alt={`${member.first_name} ${member.last_name}`}
                    />
                  ) : (
                    <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-200">
                      <span className="text-gray-500 text-3xl font-medium">
                        {member.first_name[0]}{member.last_name[0]}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Basic Info */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {member.first_name} {member.last_name}
                  </h1>
                  <p className="text-lg text-gray-600 mt-1">
                    Member #{member.member_number}
                  </p>
                  <div className="mt-2">
                    {getStatusBadge(member.status)}
                  </div>
                  {member.email && (
                    <p className="text-gray-600 mt-2">
                      <a href={`mailto:${member.email}`} className="text-blue-600 hover:underline">
                        {member.email}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-2">
                {member.status === 'pending' && (userRole === 'admin' || userRole === 'approver') && (
                  <>
                    <button
                      onClick={handleApprove}
                      className="btn btn-primary"
                    >
                      Approve Member
                    </button>
                    <button
                      onClick={handleReject}
                      className="btn btn-secondary"
                    >
                      Reject Member
                    </button>
                  </>
                )}
                {member.status === 'approved' && (
                  <button
                    onClick={handlePrintCard}
                    className="btn btn-primary"
                  >
                    Print Card
                  </button>
                )}
                {userRole === 'admin' && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="btn bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete Member
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd className="text-sm text-gray-900">{member.first_name} {member.last_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(member.date_of_birth).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="text-sm text-gray-900">{member.email || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(member.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </dd>
                </div>
              </dl>
            </div>

            {/* ID Document Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">ID Document Information</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Document Type</dt>
                  <dd className="text-sm text-gray-900">
                    {member.id_document_type.replace(/_/g, ' ').toUpperCase()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Document Number</dt>
                  <dd className="text-sm text-gray-900 font-mono">{member.id_document_number}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Issuing Country</dt>
                  <dd className="text-sm text-gray-900">{member.id_document_provider}</dd>
                </div>
                {member.id_document_provider !== 'United Kingdom' && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Indefinite Leave to Remain</dt>
                    <dd className="text-sm text-gray-900">
                      {member.indefinite_leave_to_remain ? (
                        <span className="text-green-600 font-medium">✓ Yes</span>
                      ) : (
                        <span className="text-red-600 font-medium">✗ No</span>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Address */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Address</h2>
              <address className="text-sm text-gray-900 not-italic">
                {member.address_line1}<br />
                {member.address_line2 && <>{member.address_line2}<br /></>}
                {member.city}<br />
                {member.postal_code}<br />
                {member.country}
              </address>
            </div>

            {/* Membership Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Membership Information</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Membership Type</dt>
                  <dd className="text-sm text-gray-900">
                    {membershipType?.name || 'Unknown'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Membership Fee</dt>
                  <dd className="text-sm text-gray-900">
                    £{membershipType?.fee || '0'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="text-sm">
                    {getStatusBadge(member.status)}
                  </dd>
                </div>
                {member.approved_at && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Approved Date</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(member.approved_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Audit Information (Admin Only) */}
          {userRole === 'admin' && (
            <div className="bg-white shadow rounded-lg p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Audit Information</h2>
              <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(member.created_at).toLocaleString('en-GB')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(member.updated_at).toLocaleString('en-GB')}
                  </dd>
                </div>
                {member.approved_by && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Approved By</dt>
                    <dd className="text-sm text-gray-900">User ID: {member.approved_by}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Back Button */}
          <div className="mt-6">
            <button
              onClick={() => navigate('/members')}
              className="btn btn-secondary"
            >
              ← Back to Members
            </button>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete Member
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete {member.first_name} {member.last_name} 
              (#{member.member_number})? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}