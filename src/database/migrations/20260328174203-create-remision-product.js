'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('remision_product', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      fk_remision: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      fk_product: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('Completo', 'Pendiente'),
        allowNull: false,
        defaultValue: 'Completo',
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('remision_product');
  }
};
