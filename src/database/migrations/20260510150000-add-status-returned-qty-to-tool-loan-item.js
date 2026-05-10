'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tool_loan_item', 'returned_quantity', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn('tool_loan_item', 'status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'Prestado',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('tool_loan_item', 'returned_quantity');
    await queryInterface.removeColumn('tool_loan_item', 'status');
  },
};
