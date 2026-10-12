'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable('maintenance_report');

    if (!tableDefinition.maintenance_type) {
      await queryInterface.addColumn('maintenance_report', 'maintenance_type', {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: 'Preventivo',
        after: 'status'
      });
    }

    if (!tableDefinition.recommendations) {
      await queryInterface.addColumn('maintenance_report', 'recommendations', {
        type: Sequelize.JSON,
        allowNull: true,
        after: 'maintenance_type'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable('maintenance_report');

    if (tableDefinition.recommendations) {
      await queryInterface.removeColumn('maintenance_report', 'recommendations');
    }
    if (tableDefinition.maintenance_type) {
      await queryInterface.removeColumn('maintenance_report', 'maintenance_type');
    }
  }
};
