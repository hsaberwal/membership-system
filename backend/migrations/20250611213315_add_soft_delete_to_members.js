exports.up = function(knex) {
  return knex.schema.table('members', function(table) {
    table.timestamp('deleted_at').nullable();
    table.uuid('deleted_by').nullable();
    table.index('deleted_at');
  });
};

exports.down = function(knex) {
  return knex.schema.table('members', function(table) {
    table.dropIndex('deleted_at');
    table.dropColumn('deleted_at');
    table.dropColumn('deleted_by');
  });
};
