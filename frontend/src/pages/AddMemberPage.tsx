import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Webcam from 'react-webcam';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { Navigation } from '../components/Navigation';
import { useAddressLookup } from '../hooks/useAddressLookup';
import type { MemberForm, MembershipType, Country } from '../types/index.js';

export function AddMemberPage() {
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { addresses, isLoading: addressLoading, searchByPostcode, clearAddresses } = useAddressLookup();
  const [showAddressList, setShowAddressList] = useState(false);
  
  const { register, handleSubmit, setValue, watch, getValues, formState: { errors } } = useForm<MemberForm>({
    defaultValues: {
      id_document_provider: 'United Kingdom',
      indefinite_leave_to_remain: false
    }
  });

  // Watch the id_document_provider field
  const idDocumentProvider = watch('id_document_provider');
  const showILRCheckbox = idDocumentProvider && idDocumentProvider !== 'United Kingdom';

  useEffect(() => {
    fetchMembershipTypes();
    fetchCountries();
  }, []);

  // Reset ILR when provider changes to UK
  useEffect(() => {
    if (idDocumentProvider === 'United Kingdom') {
      setValue('indefinite_leave_to_remain', false);
    }
  }, [idDocumentProvider, setValue]);

  const fetchMembershipTypes = async () => {
    try {
      const response = await api.get('/membership-types');
      setMembershipTypes(response.data);
    } catch (error) {
      toast.error('Failed to fetch membership types');
    }
  };

  const fetchCountries = async () => {
    try {
      const response = await api.get('/countries');
      setCountries(response.data);
    } catch (error) {
      toast.error('Failed to fetch countries');
      // Fallback countries if API fails
      setCountries([
        { code: 'GB', name: 'United Kingdom' },
        { code: 'US', name: 'United States' },
        { code: 'CA', name: 'Canada' },
        { code: 'AU', name: 'Australia' },
        { code: 'IE', name: 'Ireland' },
        { code: 'IN', name: 'India' },
        { code: 'OTHER', name: 'Other' }
      ]);
    }
  };

  const capturePhoto = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setPhoto(imageSrc);
      setShowCamera(false);
    }
  };

  const onSubmit = async (data: MemberForm) => {
    if (!photo) {
      toast.error('Please capture a photo');
      return;
    }
      // NEW: Validate ILR requirement for non-UK documents
    if (data.id_document_provider !== 'United Kingdom' && !data.indefinite_leave_to_remain) {
      toast.error('You must confirm Indefinite Leave to Remain status for non-UK documents');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/members', {
        ...data,
        photo_url: photo
      });
      
      toast.success('Member created successfully!');
      navigate('/members');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create member');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="Add New Member" />
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow rounded-lg p-6 space-y-6">
            {/* Photo Section */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Member Photo</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {!photo && !showCamera ? (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setShowCamera(true)}
                      className="btn btn-primary"
                    >
                      Open Camera
                    </button>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setPhoto(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label htmlFor="photo-upload" className="btn btn-secondary cursor-pointer">
                        Upload Photo
                      </label>
                    </div>
                  </div>
                ) : showCamera ? (
                  <div className="space-y-4">
                    <Webcam
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className="mx-auto rounded"
                      width={320}
                      height={240}
                    />
                    <div className="space-x-2">
                      <button type="button" onClick={capturePhoto} className="btn btn-primary">
                        Capture Photo
                      </button>
                      <button type="button" onClick={() => setShowCamera(false)} className="btn btn-secondary">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <img src={photo} alt="Member" className="mx-auto rounded" width={320} />
                    <button type="button" onClick={() => { setPhoto(null); setShowCamera(true); }} className="btn btn-secondary">
                      Retake Photo
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input {...register('first_name', { required: 'First name is required' })} className="input mt-1" />
                {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input {...register('last_name', { required: 'Last name is required' })} className="input mt-1" />
                {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name.message}</p>}
              </div>

              {/* NEW: Email field */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email <span className="text-gray-500 text-xs">(optional)</span>
                </label>
                <input 
                  {...register('email', { 
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })} 
                  type="email"
                  className="input mt-1" 
                  placeholder="john@example.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input {...register('date_of_birth', { required: 'Date of birth is required' })} type="date" className="input mt-1" />
                {errors.date_of_birth && <p className="text-red-500 text-sm mt-1">{errors.date_of_birth.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Membership Type</label>
                <select {...register('membership_type_id', { required: 'Membership type is required' })} className="input mt-1">
                  <option value="">Select type</option>
                  {membershipTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name} - £{type.fee}</option>
                  ))}
                </select>
                {errors.membership_type_id && <p className="text-red-500 text-sm mt-1">{errors.membership_type_id.message}</p>}
              </div>
            </div>

            {/* ID Document - Updated Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">ID Document Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID Document Type</label>
                  <select {...register('id_document_type', { required: 'ID type is required' })} className="input mt-1">
                    <option value="">Select type</option>
                    <option value="passport">Passport</option>
                    <option value="driving_license">Driving License</option>
                    <option value="national_id">National ID</option>
                  </select>
                  {errors.id_document_type && <p className="text-red-500 text-sm mt-1">{errors.id_document_type.message}</p>}
                </div>

                {/* MOVED: ID Document Provider (Country) - Now comes BEFORE ID Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID Document Issuing Country</label>
                  <select 
                    {...register('id_document_provider', { required: 'Issuing country is required' })} 
                    className="input mt-1"
                    defaultValue="United Kingdom"
                  >
                    <option value="">Select country</option>
                    {countries.map(country => (
                      <option key={country.code} value={country.name}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                  {errors.id_document_provider && <p className="text-red-500 text-sm mt-1">{errors.id_document_provider.message}</p>}
                </div>

                {/* MOVED: ID Number - Now comes AFTER Issuing Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID Number</label>
                  <input {...register('id_document_number', { required: 'ID number is required' })} className="input mt-1" />
                  {errors.id_document_number && <p className="text-red-500 text-sm mt-1">{errors.id_document_number.message}</p>}
                </div>

                {/* Indefinite Leave to Remain checkbox */}
                {showILRCheckbox && (
                  <div className="md:col-span-2">
                    <label className="flex items-center space-x-3">
                      <input
                        {...register('indefinite_leave_to_remain', {
                          required: idDocumentProvider !== 'United Kingdom' ? 'ILR confirmation is required for non-UK documents' : false
                        })}
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Indefinite Leave to Remain (ILR) <span className="text-red-500">*</span>
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-7">
                      You must confirm the member has indefinite leave to remain in the UK
                    </p>
                    {errors.indefinite_leave_to_remain && (
                      <p className="text-red-500 text-sm mt-1 ml-7">{errors.indefinite_leave_to_remain.message}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* Address */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Address</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
                  <input {...register('address_line1', { required: 'Address is required' })} className="input mt-1" />
                  {errors.address_line1 && <p className="text-red-500 text-sm mt-1">{errors.address_line1.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Address Line 2</label>
                  <input {...register('address_line2')} className="input mt-1" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input {...register('city', { required: 'City is required' })} className="input mt-1" />
                    {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>}
                  </div>
                  <div>
                  <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                  <div className="mt-1 flex gap-2">
                    <div className="relative flex-1">
                      <input 
                        {...register('postal_code', { required: 'Postal code is required' })}
                        className="input w-full"
                        placeholder="Enter postcode"
                      />
                      {addressLoading && (
                        <div className="absolute right-2 top-2">
                          <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const postcode = getValues('postal_code');
                        if (postcode) {
                          searchByPostcode(postcode);
                          setShowAddressList(true);
                        } else {
                          toast.error('Please enter a postcode first');
                        }
                      }}
                      disabled={addressLoading}
                      className="btn btn-secondary whitespace-nowrap"
                    >
                      {addressLoading ? 'Searching...' : 'Lookup Address'}
                    </button>
                  </div>
                  {errors.postal_code && <p className="text-red-500 text-sm mt-1">{errors.postal_code.message}</p>}
                  
                  {/* Address suggestions */}
                  {showAddressList && addresses.length > 0 && (
                    <div className="mt-2 border rounded-md shadow-sm max-h-60 overflow-y-auto">
                      {addresses.map((address) => (
                        <button
                          key={address.id}
                          type="button"
                          onClick={() => {
                            setValue('address_line1', address.line1, { shouldValidate: true });
                            setValue('address_line2', address.line2 || '');
                            setValue('city', address.city, { shouldValidate: true });
                            setValue('postal_code', address.postalCode, { shouldValidate: true });
                            setValue('country', address.country, { shouldValidate: true });
                            setShowAddressList(false);
                            clearAddresses();
                            toast.success('Address selected');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0"
                        >
                          <div className="text-sm font-medium">{address.line1}</div>
                          <div className="text-xs text-gray-500">{address.formatted}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Country</label>
                    <input {...register('country', { required: 'Country is required' })} className="input mt-1" defaultValue="UK" />
                    {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button type="button" onClick={() => navigate('/members')} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={isLoading} className="btn btn-primary">
                {isLoading ? 'Creating...' : 'Create Member'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}