'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('remision_item', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      fk_item: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      fk_remision: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      fkUser: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      fk_remision_product: {
        type: Sequelize.INTEGER,
        allowNull: true,
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('remision_item');
  }
};
