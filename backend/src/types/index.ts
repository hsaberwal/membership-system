// Database model types
export interface Member {
  id: string;
  member_number: string;
  first_name: string;
  last_name: string;
  email?: string | null; // New field
  date_of_birth: Date;
  membership_type_id: string;
  id_document_type: string;
  id_document_number: string;
  id_document_provider: string; // New field
  indefinite_leave_to_remain: boolean; // New field
  address_line1: string;
  address_line2?: string | null;
  city: string;
  postal_code: string;
  country: string;
  photo_url?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
  updated_at: Date;
  approved_at?: Date | null;
  approved_by?: string | null;
  deleted_at?: Date | null;
}

export interface CreateMemberDto {
  first_name: string;
  last_name: string;
  email?: string;
  date_of_birth: string;
  membership_type_id: string;
  id_document_type: string;
  id_document_number: string;
  id_document_provider: string;
  indefinite_leave_to_remain: boolean;
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code: string;
  country: string;
  photo_url?: string;
}

export interface UpdateMemberDto extends Partial<CreateMemberDto> {
  id: string;
}
