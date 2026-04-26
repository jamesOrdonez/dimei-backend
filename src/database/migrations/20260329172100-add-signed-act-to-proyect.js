'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable('proyect');
    if (!tableDefinition.signed_act) {
      await queryInterface.addColumn('proyect', 'signed_act', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable('proyect');
    if (tableDefinition.signed_act) {
       await queryInterface.removeColumn('proyect', 'signed_act');
    }
  }
};
