'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('elevatorType');
    
    if (!tableInfo.question_group_id) {
      await queryInterface.addColumn('elevatorType', 'question_group_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'question_group',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove question_group_id column from elevatorType table
    await queryInterface.removeColumn('elevatorType', 'question_group_id');
  }
};
