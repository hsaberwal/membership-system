// Member type for displaying member data
export interface Member {
  id: string;
  member_number: string;
  first_name: string;
  last_name: string;
  email?: string; // New field
  date_of_birth: string;
  membership_type_id: string;
  membership_type?: {
    id: string;
    name: string;
    fee: number;
  };
  id_document_type: string;
  id_document_number: string;
  id_document_provider: string; // New field
  indefinite_leave_to_remain: boolean; // New field
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code: string;
  country: string;
  photo_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  approved_at?: string;
  approved_by?: string;
}

// Form type for creating/editing members
export interface MemberForm {
  first_name: string;
  last_name: string;
  email?: string; // New field
  date_of_birth: string;
  membership_type_id: string;
  id_document_type: string;
  id_document_number: string;
  id_document_provider: string; // New field
  indefinite_leave_to_remain?: boolean; // New field
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code: string;
  country: string;
}

export interface MembershipType {
  id: string;
  name: string;
  fee: number;
  description?: string;
}

export interface Country {
  code: string;
  name: string;
}
