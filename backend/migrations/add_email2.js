// backend/migrations/20250611031322_add_email_and_id_fields.js

exports.up = async function (knex) {
  const hasEmail = await knex.schema.hasColumn('members', 'email');
  const hasIssuedBy = await knex.schema.hasColumn('members', 'id_issued_by');
  const hasIndefiniteLeave = await knex.schema.hasColumn('members', 'indefinite_leave');

  await knex.schema.alterTable('members', function (table) {
    if (!hasEmail) table.string('email').nullable();
    if (!hasIssuedBy) table.string('id_issued_by').notNullable().defaultTo('United Kingdom');
    if (!hasIndefiniteLeave) table.boolean('indefinite_leave').notNullable().defaultTo(false);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('members', function (table) {
    table.dropColumn('email');
    table.dropColumn('id_issued_by');
    table.dropColumn('indefinite_leave');
  });
};

