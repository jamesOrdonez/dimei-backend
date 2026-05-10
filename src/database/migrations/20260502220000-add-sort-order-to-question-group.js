'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('question_group');
    if (!tableInfo.sort_order) {
      await queryInterface.addColumn('question_group', 'sort_order', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      });
    }
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('question_group', 'sort_order');
  },
};
