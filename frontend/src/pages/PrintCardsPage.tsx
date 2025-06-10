import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { Navigation } from '../components/Navigation';
import { RoleBasedAccess } from '../components/RoleBasedAccess';
import Barcode from 'react-barcode';

interface ApprovedMember {
  id: string;
  member_number: string;
  first_name: string;
  last_name: string;
  membership_type_name: string;
  photo_url: string;
  card_printed?: boolean;
}

export function PrintCardsPage() {
  const navigate = useNavigate();
  const [approvedMembers, setApprovedMembers] = useState<ApprovedMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    fetchApprovedMembers();
  }, []);

  const fetchApprovedMembers = async () => {
    try {
      const response = await api.get('/members');
      const approved = response.data.filter((m: any) => m.status === 'approved');
      setApprovedMembers(approved);
    } catch (error) {
      toast.error('Failed to fetch members');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedMembers.length === approvedMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(approvedMembers.map(m => m.id));
    }
  };

  const printCards = async () => {
    if (selectedMembers.length === 0) {
      toast.error('Please select members to print');
      return;
    }

    setIsPrinting(true);
    
    // Open print preview
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print cards');
      setIsPrinting(false);
      return;
    }

    // Create print document
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Membership Cards</title>
        <style>
          @page {
            size: 85.6mm 54mm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }
          .card {
            width: 85.6mm;
            height: 54mm;
            page-break-after: always;
            position: relative;
            overflow: hidden;
            background: white;
          }
          .card:last-child {
            page-break-after: auto;
          }
          .header {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 10mm;
            color: white;
            font-weight: bold;
            font-size: 14pt;
            padding: 3mm 5mm;
            box-sizing: border-box;
          }
          .header.honorary { background: #FFD700; }
          .header.ordinary { background: #4169E1; }
          .header.life { background: #228B22; }
          .member-name {
            position: absolute;
            left: 5mm;
            top: 15mm;
            font-size: 16pt;
            font-weight: bold;
          }
          .member-type {
            position: absolute;
            left: 5mm;
            top: 22mm;
            font-size: 12pt;
            color: #666;
          }
          .photo {
            position: absolute;
            right: 5mm;
            top: 15mm;
            width: 20mm;
            height: 25mm;
            object-fit: cover;
            border: 1px solid #000;
          }
          .member-number {
            position: absolute;
            left: 5mm;
            bottom: 8mm;
            font-size: 10pt;
          }
          .barcode {
            position: absolute;
            left: 30mm;
            bottom: 5mm;
          }
        </style>
      </head>
      <body>
    `);

    // Add cards for selected members
    selectedMembers.forEach(memberId => {
      const member = approvedMembers.find(m => m.id === memberId);
      if (!member) return;

      const headerClass = member.membership_type_name.toLowerCase();
      
      printWindow.document.write(`
        <div class="card">
          <div class="header ${headerClass}">MEMBERSHIP ORGANIZATION</div>
          <div class="member-name">${member.first_name} ${member.last_name}</div>
          <div class="member-type">${member.membership_type_name.toUpperCase()} MEMBER</div>
          <img src="${member.photo_url}" class="photo" alt="Member Photo" />
          <div class="member-number">ID: ${member.member_number}</div>
          <div class="barcode">
            <svg id="barcode-${member.id}"></svg>
          </div>
        </div>
      `);
    });

    printWindow.document.write(`
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      <script>
        window.onload = function() {
          ${selectedMembers.map(memberId => {
            const member = approvedMembers.find(m => m.id === memberId);
            return member ? `JsBarcode("#barcode-${member.id}", "${member.member_number}", {
              format: "CODE128",
              width: 1,
              height: 30,
              displayValue: false
            });` : '';
          }).join('\n')}
          
          setTimeout(() => {
            window.print();
            window.close();
          }, 1000);
        }
      </script>
      </body>
      </html>
    `);

    printWindow.document.close();

    // Mark cards as printed
    try {
      await api.post('/members/mark-printed', { memberIds: selectedMembers });
      toast.success('Cards printed successfully');
      fetchApprovedMembers();
      setSelectedMembers([]);
    } catch (error) {
      console.error('Failed to mark as printed:', error);
    }

    setIsPrinting(false);
  };

  return (
    <RoleBasedAccess roles={['admin', 'printer']}>
      <div className="min-h-screen bg-gray-50">
        <Navigation title="Print Membership Cards" />
        
        <main className="p-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">
                  Approved Members ({approvedMembers.length})
                </h2>
                <div className="space-x-2">
                  <button
                    onClick={toggleSelectAll}
                    className="btn btn-secondary"
                  >
                    {selectedMembers.length === approvedMembers.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    onClick={printCards}
                    disabled={selectedMembers.length === 0 || isPrinting}
                    className="btn btn-primary"
                  >
                    {isPrinting ? 'Preparing...' : `Print ${selectedMembers.length} Cards`}
                  </button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="p-12 text-center">Loading members...</div>
            ) : approvedMembers.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                No approved members ready for card printing
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedMembers.length === approvedMembers.length}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Photo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Barcode Preview
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {approvedMembers.map((member) => (
                      <tr key={member.id} className={selectedMembers.includes(member.id) ? 'bg-blue-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(member.id)}
                            onChange={() => toggleMemberSelection(member.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {member.member_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.first_name} {member.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {member.membership_type_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img 
                            src={member.photo_url} 
                            alt="Member" 
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Barcode 
                            value={member.member_number} 
                            width={1}
                            height={30}
                            fontSize={10}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </RoleBasedAccess>
  );
}
