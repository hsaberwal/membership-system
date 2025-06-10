import { useState } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface Address {
  id: string;
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
  country: string;
  formatted: string;
}

export function useAddressLookup() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchByPostcode = async (postcode: string) => {
    if (!postcode || postcode.length < 3) {
      setAddresses([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get('/address/lookup', {
        params: { postcode }
      });
      setAddresses(response.data);
      
      if (response.data.length === 0) {
        toast.info('No addresses found for this postcode');
      }
    } catch (error) {
      console.error('Address lookup error:', error);
      toast.error('Failed to lookup address');
      setAddresses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAddresses = () => {
    setAddresses([]);
  };

  return {
    addresses,
    isLoading,
    searchByPostcode,
    clearAddresses
  };
}
