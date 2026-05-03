'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Groups (templates) of answer options e.g. "Condición" → Bueno / Regular / Malo
    await queryInterface.createTable('option_template_group', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      name: { type: Sequelize.STRING(150), allowNull: false },
      company: { type: Sequelize.INTEGER, allowNull: false },
    });

    // Individual options inside a template group
    await queryInterface.createTable('option_template', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      group_id: { type: Sequelize.INTEGER, allowNull: false },
      text: { type: Sequelize.STRING(200), allowNull: false },
      requires_photo: { type: Sequelize.TINYINT(1), allowNull: false, defaultValue: 0 },
      sort_order: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('option_template');
    await queryInterface.dropTable('option_template_group');
  },
};
