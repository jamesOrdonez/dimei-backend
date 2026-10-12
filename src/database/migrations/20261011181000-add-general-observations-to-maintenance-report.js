'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable('maintenance_report');

    if (!tableDefinition.general_observations) {
      await queryInterface.addColumn('maintenance_report', 'general_observations', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable('maintenance_report');

    if (tableDefinition.general_observations) {
      await queryInterface.removeColumn('maintenance_report', 'general_observations');
    }
  }
};
