import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { Navigation } from '../components/Navigation';
import type { Member, MembershipType } from '../types/index.js';

export function MembersPage() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  
  // Get user role from JWT or your auth context
  const userRole = localStorage.getItem('userRole') || 'viewer'; // You should get this from your auth context

  useEffect(() => {
    fetchMembers();
    fetchMembershipTypes();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [members, searchTerm, filterStatus, filterType]);

  const fetchMembers = async () => {
    try {
      const response = await api.get('/members');
      setMembers(response.data);
    } catch (error) {
      toast.error('Failed to fetch members');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembershipTypes = async () => {
    try {
      const response = await api.get('/membership-types');
      setMembershipTypes(response.data);
    } catch (error) {
      toast.error('Failed to fetch membership types');
    }
  };

  const filterMembers = () => {
    let filtered = members;

    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.member_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.id_document_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(member => member.status === filterStatus);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(member => member.membership_type_id === filterType);
    }

    setFilteredMembers(filtered);
  };

  const handleDeleteClick = (member: Member) => {
    setMemberToDelete(member);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;

    try {
      await api.delete(`/members/${memberToDelete.id}`);
      toast.success('Member deleted successfully');
      setShowDeleteModal(false);
      setMemberToDelete(null);
      fetchMembers(); // Refresh the list
    } catch (error) {
      toast.error('Failed to delete member');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[status as keyof typeof statusClasses]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const toggleMemberExpand = (memberId: string) => {
    setExpandedMember(expandedMember === memberId ? null : memberId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation title="Members" />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="Members" />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header with Add Button */}
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Members Directory</h1>
            <button
              onClick={() => navigate('/members/add')}
              className="btn btn-primary"
            >
              Add New Member
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white shadow rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Membership Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="input"
                >
                  <option value="all">All Types</option>
                  {membershipTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <span className="text-sm text-gray-500">
                  Showing {filteredMembers.length} of {members.length} members
                </span>
              </div>
            </div>
          </div>

          {/* Members List */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID Document
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Membership
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMembers.map((member) => (
                    <React.Fragment key={member.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              {member.photo_url ? (
                                <img
                                  className="h-12 w-12 rounded-full object-cover"
                                  src={member.photo_url}
                                  alt={`${member.first_name} ${member.last_name}`}
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-500 font-medium">
                                    {member.first_name[0]}{member.last_name[0]}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {member.first_name} {member.last_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                #{member.member_number}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{member.email || 'No email'}</div>
                          <div className="text-sm text-gray-500">
                            DOB: {new Date(member.date_of_birth).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {member.id_document_type.replace('_', ' ').toUpperCase()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {member.id_document_provider}
                          </div>
                          {member.id_document_provider !== 'United Kingdom' && (
                            <div className="text-xs text-blue-600 mt-1">
                              ILR: {member.indefinite_leave_to_remain ? '✓' : '✗'}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {membershipTypes.find(t => t.id === member.membership_type_id)?.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            Since: {new Date(member.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(member.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => toggleMemberExpand(member.id)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            {expandedMember === member.id ? 'Less' : 'More'}
                          </button>
                          <button
                            onClick={() => navigate(`/members/${member.id}`)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            View
                          </button>
                          {userRole === 'admin' && (
                            <button
                              onClick={() => handleDeleteClick(member)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                      {/* Expanded Details Row */}
                      {expandedMember === member.id && (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <h4 className="font-semibold text-gray-700 mb-2">Address</h4>
                                <p className="text-sm text-gray-600">
                                  {member.address_line1}<br />
                                  {member.address_line2 && <>{member.address_line2}<br /></>}
                                  {member.city}, {member.postal_code}<br />
                                  {member.country}
                                </p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-700 mb-2">ID Details</h4>
                                <p className="text-sm text-gray-600">
                                  Number: {member.id_document_number}<br />
                                  Type: {member.id_document_type}<br />
                                  Provider: {member.id_document_provider}
                                </p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-700 mb-2">Metadata</h4>
                                <p className="text-sm text-gray-600">
                                  Created: {new Date(member.created_at).toLocaleString()}<br />
                                  Updated: {new Date(member.updated_at).toLocaleString()}<br />
                                  {member.approved_at && (
                                    <>Approved: {new Date(member.approved_at).toLocaleString()}</>
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredMembers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No members found</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && memberToDelete && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete Member
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete {memberToDelete.first_name} {memberToDelete.last_name} 
              (#{memberToDelete.member_number})? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
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