'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('tool_loan_status_history');

    if (!tableInfo.tool_id) {
      await queryInterface.addColumn('tool_loan_status_history', 'tool_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    if (!tableInfo.qty) {
      await queryInterface.addColumn('tool_loan_status_history', 'qty', {
        type: Sequelize.FLOAT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('tool_loan_status_history', 'tool_id');
    await queryInterface.removeColumn('tool_loan_status_history', 'qty');
  },
};
