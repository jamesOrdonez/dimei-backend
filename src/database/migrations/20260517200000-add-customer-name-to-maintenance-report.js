'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('maintenance_report', 'customer_name', {
      type: Sequelize.STRING(150),
      allowNull: true,
      after: 'customer_signature'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('maintenance_report', 'customer_name');
  }
};
