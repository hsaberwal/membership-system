import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { Navigation } from '../components/Navigation';
import { AdminOnly } from '../components/RoleBasedAccess';

interface MembershipType {
  id: string;
  name: string;
  fee: number;
}

export function CardDesignerPage() {
  const navigate = useNavigate();
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchMembershipTypes();
  }, []);

  const fetchMembershipTypes = async () => {
    try {
      const response = await api.get('/membership-types');
      setMembershipTypes(response.data);
      if (response.data.length > 0) {
        setSelectedType(response.data[0].id);
      }
    } catch (error) {
      toast.error('Failed to fetch membership types');
    }
  };

  const saveTemplate = async () => {
    if (!selectedType) return;

    setIsSaving(true);
    try {
      const membershipType = membershipTypes.find(t => t.id === selectedType);
      
      // For now, save a predefined template structure
      const template = {
        version: '1.0',
        membershipType: membershipType?.name,
        elements: [
          { type: 'text', value: 'MEMBERSHIP ORGANIZATION', x: 50, y: 30, fontSize: 24, color: '#FFFFFF' },
          { type: 'text', value: '[MEMBER_NAME]', x: 50, y: 150, fontSize: 28, color: '#000000' },
          { type: 'text', value: membershipType?.name + ' MEMBER', x: 50, y: 200, fontSize: 20, color: '#666666' },
          { type: 'rect', value: '[PHOTO]', x: 600, y: 150, width: 200, height: 250, color: '#f0f0f0' },
          { type: 'text', value: '[MEMBER_NUMBER]', x: 50, y: 450, fontSize: 18, color: '#000000' },
          { type: 'rect', value: '[BARCODE]', x: 300, y: 430, width: 250, height: 80, color: '#FFFFFF' }
        ]
      };
      
      await api.post('/card-templates', {
        membership_type_id: selectedType,
        template_name: `Template for ${membershipType?.name}`,
        template_data: template
      });
      
      toast.success('Template saved successfully');
    } catch (error) {
      toast.error('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedMembershipType = membershipTypes.find(t => t.id === selectedType);
  const bgColors: Record<string, string> = {
    'Honorary': '#FFD700',
    'Ordinary': '#4169E1',
    'Life': '#228B22'
  };

  return (
    <AdminOnly>
      <div className="min-h-screen bg-gray-50">
        <Navigation title="Card Template Designer" />
        
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              {/* Controls */}
              <div className="mb-6 space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium">Membership Type:</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="input"
                  >
                    {membershipTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name} - £{type.fee}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex justify-end">
                  <button 
                    onClick={saveTemplate} 
                    disabled={isSaving}
                    className="btn btn-primary"
                  >
                    {isSaving ? 'Saving...' : 'Save Template'}
                  </button>
                </div>
              </div>

              {/* Card Preview */}
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                <div className="relative bg-white" style={{ width: '856px', height: '540px' }}>
                  {/* Background Header */}
                  <div 
                    className="absolute top-0 left-0 w-full"
                    style={{ 
                      height: '100px', 
                      backgroundColor: selectedMembershipType ? bgColors[selectedMembershipType.name] || '#000' : '#000'
                    }}
                  >
                    <h2 className="text-white text-2xl font-bold p-6">MEMBERSHIP ORGANIZATION</h2>
                  </div>

                  {/* Member Name */}
                  <div className="absolute" style={{ left: '50px', top: '150px' }}>
                    <p className="text-3xl font-semibold">[MEMBER_NAME]</p>
                  </div>

                  {/* Member Type */}
                  <div className="absolute" style={{ left: '50px', top: '200px' }}>
                    <p className="text-xl text-gray-600">
                      {selectedMembershipType?.name.toUpperCase()} MEMBER
                    </p>
                  </div>

                  {/* Photo Placeholder */}
                  <div 
                    className="absolute border-2 border-gray-400 bg-gray-100 flex items-center justify-center"
                    style={{ 
                      left: '600px', 
                      top: '150px', 
                      width: '200px', 
                      height: '250px' 
                    }}
                  >
                    <span className="text-gray-500">[PHOTO]</span>
                  </div>

                  {/* Member Number */}
                  <div className="absolute" style={{ left: '50px', top: '450px' }}>
                    <p className="text-lg">[MEMBER_NUMBER]</p>
                  </div>

                  {/* Barcode Placeholder */}
                  <div 
                    className="absolute border border-gray-400 bg-white flex items-center justify-center"
                    style={{ 
                      left: '300px', 
                      top: '430px', 
                      width: '250px', 
                      height: '80px' 
                    }}
                  >
                    <span className="text-gray-500">[BARCODE]</span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-4 text-sm text-gray-600">
                <p>This is a preview of the membership card template. When printed, the placeholders will be replaced with:</p>
                <ul className="mt-2 space-y-1">
                  <li>• [MEMBER_NAME] - Member's full name</li>
                  <li>• [MEMBER_NUMBER] - Unique member number</li>
                  <li>• [PHOTO] - Member's photo</li>
                  <li>• [BARCODE] - Barcode of member number</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AdminOnly>
  );
}
