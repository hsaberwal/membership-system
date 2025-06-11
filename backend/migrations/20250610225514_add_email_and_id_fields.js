exports.up = function(knex) {
  return knex.schema.table('members', function(table) {
    table.string('email'); // optional
    table.string('id_issued_by').notNullable().defaultTo("UK"); // required
    table.boolean('indefinite_leave').notNullable().defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.table('members', function(table) {
    table.dropColumn('email');
    table.dropColumn('id_issued_by');
    table.dropColumn('indefinite_leave');
  });
};

