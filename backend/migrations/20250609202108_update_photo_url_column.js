exports.up = function(knex) {
  return knex.schema.alterTable('members', table => {
    table.text('photo_url').alter();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('members', table => {
    table.string('photo_url', 500).alter();
  });
};
