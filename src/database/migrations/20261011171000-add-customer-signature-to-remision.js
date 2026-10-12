'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable('remision');

    if (!tableDefinition.customer_signature) {
      await queryInterface.addColumn('remision', 'customer_signature', {
        type: Sequelize.TEXT('long'),
        allowNull: true
      });
    }

    if (!tableDefinition.customer_name) {
      await queryInterface.addColumn('remision', 'customer_name', {
        type: Sequelize.STRING(150),
        allowNull: true
      });
    }

    if (!tableDefinition.signed_date) {
      await queryInterface.addColumn('remision', 'signed_date', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable('remision');

    if (tableDefinition.signed_date) {
      await queryInterface.removeColumn('remision', 'signed_date');
    }
    if (tableDefinition.customer_name) {
      await queryInterface.removeColumn('remision', 'customer_name');
    }
    if (tableDefinition.customer_signature) {
      await queryInterface.removeColumn('remision', 'customer_signature');
    }
  }
};
