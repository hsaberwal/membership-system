exports.up = async function(knex) {
  const hasEmail = await knex.schema.hasColumn('members', 'email');
  const hasIdProvider = await knex.schema.hasColumn('members', 'id_document_provider');
  const hasILR = await knex.schema.hasColumn('members', 'indefinite_leave_to_remain');

  return knex.schema.table('members', function(table) {
    // Only add columns that don't exist
    if (!hasEmail) {
      table.string('email', 255).nullable();
    }
    
    if (!hasIdProvider) {
      table.string('id_document_provider', 100).notNullable().defaultTo('United Kingdom');
    }
    
    if (!hasILR) {
      table.boolean('indefinite_leave_to_remain').defaultTo(false);
    }
    
    // Add indexes only if columns were added
    if (!hasEmail) {
      table.index('email');
    }
    if (!hasIdProvider) {
      table.index('id_document_provider');
    }
  });
};

exports.down = async function(knex) {
  const hasEmail = await knex.schema.hasColumn('members', 'email');
  const hasIdProvider = await knex.schema.hasColumn('members', 'id_document_provider');
  const hasILR = await knex.schema.hasColumn('members', 'indefinite_leave_to_remain');

  return knex.schema.table('members', function(table) {
    // Only remove columns that exist
    if (hasEmail) {
      table.dropIndex('email');
      table.dropColumn('email');
    }
    
    if (hasIdProvider) {
      table.dropIndex('id_document_provider');
      table.dropColumn('id_document_provider');
    }
    
    if (hasILR) {
      table.dropColumn('indefinite_leave_to_remain');
    }
  });
};
