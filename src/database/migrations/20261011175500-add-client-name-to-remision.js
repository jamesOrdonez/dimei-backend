'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable('remision');

    if (!tableDefinition.client_name) {
      await queryInterface.addColumn('remision', 'client_name', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable('remision');

    if (tableDefinition.client_name) {
      await queryInterface.removeColumn('remision', 'client_name');
    }
  }
};
