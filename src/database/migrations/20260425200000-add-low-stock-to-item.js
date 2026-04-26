'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable('item');
    if (!tableDefinition.low_stock) {
      await queryInterface.addColumn('item', 'low_stock', {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: 3,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('item', 'low_stock');
  }
};
