import axios from 'axios';
import { config } from '../config';

interface LoqateAddress {
  Id: string;
  Type: string;
  Text: string;
  Description: string;
}

interface LoqateDetailedAddress {
  Line1: string;
  Line2: string;
  City: string;
  PostalCode: string;
  CountryName: string;
}

export const loqateService = {
  async findAddresses(postcode: string): Promise<any[]> {
    try {
      if (!config.LOQATE_API_KEY) {
        console.log('Loqate API key not configured');
        return [];
      }

      const response = await axios.get('https://api.addressy.com/Capture/Interactive/Find/v1.10/json3.ws', {
        params: {
          Key: config.LOQATE_API_KEY,
          Text: postcode,
          Countries: 'GB',
          Limit: 10,
        },
      });

      if (response.data.Items && response.data.Items.length > 0) {
        const addresses = await Promise.all(
          response.data.Items.map((item: LoqateAddress) => this.retrieveAddress(item.Id))
        );
        return addresses.filter(Boolean);
      }

      return [];
    } catch (error) {
      console.error('Loqate API error:', error);
      return [];
    }
  },

  async retrieveAddress(id: string): Promise<any> {
    try {
      const response = await axios.get('https://api.addressy.com/Capture/Interactive/Retrieve/v1.00/json3.ws', {
        params: {
          Key: config.LOQATE_API_KEY,
          Id: id,
        },
      });

      if (response.data.Items && response.data.Items.length > 0) {
        const item = response.data.Items[0];
        return {
          id: id,
          line1: item.Line1 || '',
          line2: item.Line2 || '',
          city: item.City || item.PostTown || '',
          postalCode: item.PostalCode || '',
          country: item.CountryName || 'United Kingdom',
          formatted: `${item.Line1}, ${item.City || item.PostTown}, ${item.PostalCode}`,
        };
      }

      return null;
    } catch (error) {
      console.error('Loqate retrieve error:', error);
      return null;
    }
  },
};
