'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tool_loan_status_history', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      tool_loan_id: { type: Sequelize.INTEGER, allowNull: false },
      status: { type: Sequelize.STRING, allowNull: false },
      observations: { type: Sequelize.TEXT, allowNull: true },
      changed_by: { type: Sequelize.INTEGER, allowNull: false },
      date: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('tool_loan_status_history');
  }
};
