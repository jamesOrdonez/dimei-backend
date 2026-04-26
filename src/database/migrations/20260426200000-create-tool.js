'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tool', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      amount: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      group_item: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      position1: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      position2: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      position3: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      price: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      unitOfMeasure: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      user: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      company: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      img: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('tool');
  }
};
