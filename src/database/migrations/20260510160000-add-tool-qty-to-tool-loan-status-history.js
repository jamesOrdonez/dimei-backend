'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tool_loan_status_history', 'tool_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('tool_loan_status_history', 'qty', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('tool_loan_status_history', 'tool_id');
    await queryInterface.removeColumn('tool_loan_status_history', 'qty');
  },
};
