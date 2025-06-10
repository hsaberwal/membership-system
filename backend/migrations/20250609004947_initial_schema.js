exports.up = function(knex) {
  return knex.schema
    .createTable('users', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('username', 50).unique().notNullable();
      table.string('email', 255).unique().notNullable();
      table.string('password_hash', 255).notNullable();
      table.enum('role', ['admin', 'data-entry', 'printer', 'editor', 'approver']).notNullable();
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('membership_types', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name', 50).unique().notNullable();
      table.decimal('fee', 10, 2).notNullable();
      table.string('id_prefix', 20).notNullable();
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('members', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('member_number', 20).unique();
      table.uuid('membership_type_id').references('id').inTable('membership_types');
      table.string('first_name', 100).notNullable();
      table.string('last_name', 100).notNullable();
      table.date('date_of_birth').notNullable();
      table.string('address_line1', 255);
      table.string('address_line2', 255);
      table.string('city', 100);
      table.string('postal_code', 20);
      table.string('country', 100);
      table.string('id_document_type', 50);
      table.string('id_document_number', 100);
      table.string('photo_url', 500);
      table.enum('status', ['pending', 'approved', 'rejected', 'suspended']).defaultTo('pending');
      table.timestamp('approval_date');
      table.uuid('approved_by').references('id').inTable('users');
      table.string('aml_check_status', 20);
      table.timestamp('aml_check_date');
      table.uuid('created_by').references('id').inTable('users');
      table.timestamps(true, true);
      
      table.index('status');
      table.index('member_number');
    })
    .createTable('audit_logs', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users');
      table.string('action', 100).notNullable();
      table.string('entity_type', 50).notNullable();
      table.uuid('entity_id');
      table.jsonb('old_values');
      table.jsonb('new_values');
      table.specificType('ip_address', 'inet');
      table.text('user_agent');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      table.index(['user_id']);
      table.index(['entity_type', 'entity_id']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('audit_logs')
    .dropTableIfExists('members')
    .dropTableIfExists('membership_types')
    .dropTableIfExists('users');
};
