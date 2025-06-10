exports.up = function(knex) {
  return knex.schema
    // Create events table
    .createTable('events', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name', 200).notNullable();
      table.text('description');
      table.date('event_date').notNullable();
      table.time('start_time');
      table.time('end_time');
      table.string('location', 255);
      table.uuid('created_by').references('id').inTable('users');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      table.index('event_date');
    })
    // Create event attendance table
    .createTable('event_attendance', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('event_id').references('id').inTable('events').onDelete('CASCADE');
      table.uuid('member_id').references('id').inTable('members').onDelete('CASCADE');
      table.timestamp('check_in_time').defaultTo(knex.fn.now());
      table.uuid('checked_in_by').references('id').inTable('users');
      
      table.unique(['event_id', 'member_id']);
      table.index('event_id');
      table.index('member_id');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('event_attendance')
    .dropTableIfExists('events');
};
