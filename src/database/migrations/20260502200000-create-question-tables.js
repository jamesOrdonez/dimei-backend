'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('question_group', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      name: { type: Sequelize.STRING(150), allowNull: false },
      company: { type: Sequelize.INTEGER, allowNull: false },
    });

    await queryInterface.createTable('question', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      group_id: { type: Sequelize.INTEGER, allowNull: false },
      text: { type: Sequelize.STRING(500), allowNull: false },
      type: {
        type: Sequelize.ENUM('unica', 'multiple', 'abierta', 'fotos'),
        allowNull: false,
      },
      min_photos: { type: Sequelize.INTEGER, allowNull: true },
      max_photos: { type: Sequelize.INTEGER, allowNull: true },
      order: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
    });

    await queryInterface.createTable('answer_option', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      question_id: { type: Sequelize.INTEGER, allowNull: false },
      text: { type: Sequelize.STRING(200), allowNull: false },
      requires_photo: { type: Sequelize.TINYINT(1), allowNull: false, defaultValue: 0 },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('answer_option');
    await queryInterface.dropTable('question');
    await queryInterface.dropTable('question_group');
  }
};
