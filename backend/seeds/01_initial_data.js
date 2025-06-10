exports.seed = async function(knex) {
  // Clear existing data
  await knex('members').del();
  await knex('membership_types').del();
  await knex('users').del();

  // Insert membership types
  await knex('membership_types').insert([
    {
      name: 'Honorary',
      fee: 0,
      id_prefix: '5020250000',
    },
    {
      name: 'Ordinary',
      fee: 5,
      id_prefix: '2025000000',
    },
    {
      name: 'Life',
      fee: 151,
      id_prefix: '1000000000',
    },
  ]);

  // Create admin user (password: admin123)
  // This is the bcrypt hash for 'admin123' with 10 rounds
  await knex('users').insert([
    {
      username: 'admin',
      email: 'admin@membership.com',
      password_hash: '$2b$10$5QvIJvNfT8DHqSRdNpNO4OQNTaXn6sKGKmJqSHrWC5rAhSBu3Qgk.',
      role: 'admin',
      is_active: true,
    },
  ]);

  console.log('Seed data inserted successfully');
};
