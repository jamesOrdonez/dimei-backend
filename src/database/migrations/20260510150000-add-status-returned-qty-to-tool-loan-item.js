'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('tool_loan_item');
    
    if (!tableInfo.returned_quantity) {
      await queryInterface.addColumn('tool_loan_item', 'returned_quantity', {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      });
    }

    if (!tableInfo.status) {
      await queryInterface.addColumn('tool_loan_item', 'status', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Prestado',
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('tool_loan_item', 'returned_quantity');
    await queryInterface.removeColumn('tool_loan_item', 'status');
  },
};
