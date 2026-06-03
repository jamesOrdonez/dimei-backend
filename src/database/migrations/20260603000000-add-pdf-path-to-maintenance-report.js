'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('maintenance_report', 'pdf_path', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'status'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('maintenance_report', 'pdf_path');
  }
};
