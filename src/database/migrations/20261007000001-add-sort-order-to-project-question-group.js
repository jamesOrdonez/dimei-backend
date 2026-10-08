'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('proyect_question_group');
    if (!tableInfo.sort_order) {
      await queryInterface.addColumn('proyect_question_group', 'sort_order', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      });
    }
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('proyect_question_group');
    if (tableInfo.sort_order) {
      await queryInterface.removeColumn('proyect_question_group', 'sort_order');
    }
  },
};
