import { Request, Response, NextFunction } from 'express';
import { db } from '../database';
import jwt from 'jsonwebtoken';
import { config } from '../config';

interface AuthRequest extends Request {
  user?: any;
}

export const auditLogger = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Only log state-changing operations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const originalSend = res.json;
    
    res.json = function(data) {
      // Log after successful response
      if (res.statusCode < 400) {
        const token = req.headers.authorization?.split(' ')[1];
        let userId = null;
        
        if (token) {
          try {
            const decoded = jwt.verify(token, config.JWT_SECRET) as any;
            userId = decoded.id;
          } catch (e) {}
        }
        
        // Log to audit table
        db('audit_logs').insert({
          user_id: userId,
          action: `${req.method} ${req.path}`,
          entity_type: req.path.split('/')[2] || 'unknown',
          entity_id: req.params.id || null,
          new_values: req.body ? JSON.stringify(req.body) : null,
          ip_address: req.ip,
          user_agent: req.headers['user-agent'],
          created_at: new Date()
        }).catch(err => console.error('Audit log error:', err));
      }
      
      return originalSend.call(this, data);
    };
  }
  
  next();
};
