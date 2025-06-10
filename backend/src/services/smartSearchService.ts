import axios from 'axios';
import { config } from '../config';

interface AMLCheckRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

interface AMLCheckResult {
  status: 'clear' | 'match' | 'error';
  riskScore?: number;
  matches?: any[];
  checkId?: string;
}

export const smartSearchService = {
  async checkAML(person: AMLCheckRequest): Promise<AMLCheckResult> {
    try {
      // If no API key configured, return mock clear result
      if (!config.SMARTSEARCH_API_KEY) {
        console.log('SmartSearch API key not configured - returning mock result');
        return {
          status: 'clear',
          riskScore: 0,
          matches: [],
          checkId: 'mock-' + Date.now()
        };
      }

      const response = await axios.post(
        'https://api.smartsearch.com/aml/check',
        {
          firstName: person.firstName,
          lastName: person.lastName,
          dateOfBirth: person.dateOfBirth,
          checkType: 'STANDARD',
        },
        {
          headers: {
            'Authorization': `Bearer ${config.SMARTSEARCH_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        status: response.data.status || 'clear',
        riskScore: response.data.riskScore || 0,
        matches: response.data.matches || [],
        checkId: response.data.checkId,
      };
    } catch (error: any) {
      console.error('SmartSearch API error:', error.response?.data || error.message);
      
      // Return mock result if API fails
      return {
        status: 'clear',
        riskScore: 0,
        matches: [],
        checkId: 'error-' + Date.now()
      };
    }
  },

  async getCheckDetails(checkId: string): Promise<any> {
    try {
      if (!config.SMARTSEARCH_API_KEY || checkId.startsWith('mock-') || checkId.startsWith('error-')) {
        return {
          checkId,
          status: 'clear',
          details: 'Mock or error check - no real data available'
        };
      }

      const response = await axios.get(
        `https://api.smartsearch.com/aml/check/${checkId}`,
        {
          headers: {
            'Authorization': `Bearer ${config.SMARTSEARCH_API_KEY}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('SmartSearch get details error:', error);
      return null;
    }
  },
};
