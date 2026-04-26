'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tool_loan_item', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      tool_loan_id: { type: Sequelize.INTEGER, allowNull: false },
      tool_id: { type: Sequelize.INTEGER, allowNull: false },
      quantity: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 1 },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('tool_loan_item');
  }
};
