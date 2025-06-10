import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { db, initializeDatabase } from './database';
import { loqateService } from './services/loqateService';
import { smartSearchService } from './services/smartSearchService';
import { auditLogger } from './middlewares/auditLogger';
// import routes from './routes';

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(auditLogger);
// Routes
// app.use('/api', routes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

async function start() {
  await initializeDatabase();
  
  app.listen(config.PORT, () => {
    console.log(`Server running on http://localhost:${config.PORT}`);
  });
}

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await db('users')
      .where({ username })
      .first();

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRY }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all members
app.get('/api/members', async (req, res) => {
  try {
    const members = await db('members')
      .select('members.*', 'membership_types.name as membership_type_name')
      .leftJoin('membership_types', 'members.membership_type_id', 'membership_types.id')
      .orderBy('created_at', 'desc');

    res.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// Get membership types
app.get('/api/membership-types', async (req, res) => {
  try {
    const types = await db('membership_types')
      .select('*')
      .where('is_active', true)
      .orderBy('name');

    res.json(types);
  } catch (error) {
    console.error('Error fetching membership types:', error);
    res.status(500).json({ error: 'Failed to fetch membership types' });
  }
});

// Create new member
app.post('/api/members', async (req, res) => {
  try {
    const memberData = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as any;

    // Get the membership type to determine the ID prefix
    const membershipType = await db('membership_types')
      .where({ id: memberData.membership_type_id })
      .first();

    if (!membershipType) {
      return res.status(400).json({ error: 'Invalid membership type' });
    }

    // Perform AML check
    console.log('Performing AML check for:', memberData.first_name, memberData.last_name);
    const amlResult = await smartSearchService.checkAML({
      firstName: memberData.first_name,
      lastName: memberData.last_name,
      dateOfBirth: memberData.date_of_birth
    });

    console.log('AML check result:', amlResult);

    // Generate member number
    const lastMember = await db('members')
      .where('member_number', 'like', `${membershipType.id_prefix}%`)
      .orderBy('member_number', 'desc')
      .first();

    let nextNumber = membershipType.id_prefix;
    if (lastMember) {
      const lastNum = parseInt(lastMember.member_number);
      nextNumber = (lastNum + 1).toString();
    }

    // Create member
    const [member] = await db('members').insert({
      ...memberData,
      member_number: nextNumber,
      status: 'pending',
      aml_check_status: amlResult.status,
      aml_check_date: new Date(),
      created_by: decoded.id,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');

    res.json(member);
  } catch (error) {
    console.error('Error creating member:', error);
    res.status(500).json({ error: 'Failed to create member' });
  }
});

// Approve member
app.put('/api/members/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as any;

    // Check if user has approval permission (admin or approver)
    if (decoded.role !== 'admin' && decoded.role !== 'approver') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Update member status
    const [member] = await db('members')
      .where({ id })
      .update({
        status: 'approved',
        approved_by: decoded.id,
        approval_date: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Log the approval action
    await db('audit_logs').insert({
      user_id: decoded.id,
      action: 'APPROVE_MEMBER',
      entity_type: 'member',
      entity_id: id,
      created_at: new Date()
    });

    res.json(member);
  } catch (error) {
    console.error('Error approving member:', error);
    res.status(500).json({ error: 'Failed to approve member' });
  }
});

// Reject member
app.put('/api/members/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as any;

    // Check if user has approval permission
    if (decoded.role !== 'admin' && decoded.role !== 'approver') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Update member status
    const [member] = await db('members')
      .where({ id })
      .update({
        status: 'rejected',
        approved_by: decoded.id,
        approval_date: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Log the rejection
    await db('audit_logs').insert({
      user_id: decoded.id,
      action: 'REJECT_MEMBER',
      entity_type: 'member',
      entity_id: id,
      new_values: { reason },
      created_at: new Date()
    });

    res.json(member);
  } catch (error) {
    console.error('Error rejecting member:', error);
    res.status(500).json({ error: 'Failed to reject member' });
  }
});

// Address lookup endpoint
app.get('/api/address/lookup', async (req, res) => {
  try {
    const { postcode } = req.query;
    
    if (!postcode) {
      return res.status(400).json({ error: 'Postcode is required' });
    }
    
    const addresses = await loqateService.findAddresses(postcode as string);
    res.json(addresses);
  } catch (error) {
    console.error('Address lookup error:', error);
    res.status(500).json({ error: 'Failed to lookup address' });
  }
});

// Get card templates
app.get('/api/card-templates', async (req, res) => {
  try {
    const templates = await db('card_templates')
      .select('card_templates.*', 'membership_types.name as membership_type_name')
      .leftJoin('membership_types', 'card_templates.membership_type_id', 'membership_types.id')
      .where('card_templates.is_active', true)
      .orderBy('card_templates.created_at', 'desc');
    
    res.json(templates);
  } catch (error) {
    console.error('Error fetching card templates:', error);
    res.status(500).json({ error: 'Failed to fetch card templates' });
  }
});

// Create/update card template
app.post('/api/card-templates', async (req, res) => {
  try {
    const { membership_type_id, template_name, template_data } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Check if template exists for this membership type
    const existing = await db('card_templates')
      .where({ membership_type_id })
      .first();
    
    if (existing) {
      // Update existing template
      const [updated] = await db('card_templates')
        .where({ id: existing.id })
        .update({
          template_name,
          template_data,
          updated_at: new Date()
        })
        .returning('*');
      
      res.json(updated);
    } else {
      // Create new template
      const [created] = await db('card_templates')
        .insert({
          membership_type_id,
          template_name,
          template_data,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');
      
      res.json(created);
    }
  } catch (error) {
    console.error('Error saving card template:', error);
    res.status(500).json({ error: 'Failed to save card template' });
  }
});

// Get template for specific membership type
app.get('/api/card-templates/type/:typeId', async (req, res) => {
  try {
    const { typeId } = req.params;
    
    const template = await db('card_templates')
      .where({ 
        membership_type_id: typeId,
        is_active: true 
      })
      .first();
    
    res.json(template || null);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Get all events
app.get('/api/events', async (req, res) => {
  try {
    const events = await db('events')
      .select('events.*')
      .select(db.raw('COUNT(DISTINCT event_attendance.member_id) as attendee_count'))
      .leftJoin('event_attendance', 'events.id', 'event_attendance.event_id')
      .groupBy('events.id')
      .orderBy('events.event_date', 'desc')
      .orderBy('events.start_time', 'desc');
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Create event
app.post('/api/events', async (req, res) => {
  try {
    const eventData = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const [event] = await db('events').insert({
      ...eventData,
      created_by: decoded.id,
      created_at: new Date()
    }).returning('*');
    
    res.json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Get event details with attendees
app.get('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await db('events')
      .where({ id })
      .first();
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const attendees = await db('event_attendance')
      .select('members.*', 'event_attendance.check_in_time')
      .join('members', 'event_attendance.member_id', 'members.id')
      .where('event_attendance.event_id', id)
      .orderBy('event_attendance.check_in_time', 'desc');
    
    res.json({ ...event, attendees });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event details' });
  }
});

// Check-in member to event
app.post('/api/events/:id/checkin', async (req, res) => {
  try {
    const { id } = req.params;
    const { memberNumber } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    
    // Find member by number
    const member = await db('members')
      .where({ member_number: memberNumber })
      .first();
    
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    if (member.status !== 'approved') {
      return res.status(400).json({ error: 'Member is not approved' });
    }
    
    // Check if already checked in
    const existing = await db('event_attendance')
      .where({
        event_id: id,
        member_id: member.id
      })
      .first();
    
    if (existing) {
      return res.status(400).json({ error: 'Member already checked in' });
    }
    
    // Create attendance record
    const [attendance] = await db('event_attendance').insert({
      event_id: id,
      member_id: member.id,
      checked_in_by: decoded.id,
      check_in_time: new Date()
    }).returning('*');
    
    res.json({
      success: true,
      member: {
        name: `${member.first_name} ${member.last_name}`,
        member_number: member.member_number,
        membership_type: member.membership_type_id
      }
    });
  } catch (error) {
    console.error('Error checking in member:', error);
    res.status(500).json({ error: 'Failed to check in member' });
  }
});

// Get all users (admin only)
app.get('/api/users', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const users = await db('users')
      .select('id', 'username', 'email', 'role', 'is_active', 'created_at')
      .orderBy('created_at', 'desc');
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create new user (admin only)
app.post('/api/users', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Check if username or email already exists
    const existing = await db('users')
      .where({ username })
      .orWhere({ email })
      .first();
    
    if (existing) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const [user] = await db('users').insert({
      username,
      email,
      password_hash: hashedPassword,
      role,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }).returning(['id', 'username', 'email', 'role']);
    
    res.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user status (admin only)
app.patch('/api/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Don't allow disabling your own account
    if (decoded.id === id && !is_active) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }
    
    const [updated] = await db('users')
      .where({ id })
      .update({
        is_active,
        updated_at: new Date()
      })
      .returning('*');
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Reset user password (admin only)
app.post('/api/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Generate new password
    const newPassword = 'Pass' + Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await db('users')
      .where({ id })
      .update({
        password_hash: hashedPassword,
        updated_at: new Date()
      });
    
    res.json({ newPassword });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Get audit logs
app.get('/api/audit-logs', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  const decoded = jwt.verify(token, config.JWT_SECRET) as any;
  if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  
  const logs = await db('audit_logs')
    .select('audit_logs.*', 'users.username')
    .leftJoin('users', 'audit_logs.user_id', 'users.id')
    .orderBy('audit_logs.created_at', 'desc')
    .limit(100);
    
  res.json(logs);
});

// Create test users endpoint (admin only)
app.post('/api/users/create-test-users', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as any;

    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Create one user for each role
    const testUsers = [
      { username: 'dataentry', email: 'dataentry@membership.com', role: 'data-entry' },
      { username: 'printer', email: 'printer@membership.com', role: 'printer' },
      { username: 'editor', email: 'editor@membership.com', role: 'editor' },
      { username: 'approver', email: 'approver@membership.com', role: 'approver' }
    ];

    const hashedPassword = await bcrypt.hash('test123', 10);
    const createdUsers = [];

    for (const user of testUsers) {
      // Check if user already exists
      const existing = await db('users').where({ username: user.username }).first();
      if (!existing) {
        const [newUser] = await db('users').insert({
          ...user,
          password_hash: hashedPassword,
          is_active: true
        }).returning(['username', 'email', 'role']);
        createdUsers.push(newUser);
      }
    }

    res.json({
      message: 'Test users created',
      users: createdUsers,
      note: 'All users have password: test123'
    });
  } catch (error) {
    console.error('Error creating test users:', error);
    res.status(500).json({ error: 'Failed to create test users' });
  }
});

start().catch(console.error);
