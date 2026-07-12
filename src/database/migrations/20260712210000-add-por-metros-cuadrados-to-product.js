'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('product', 'por_metros_cuadrados', {
      type: Sequelize.TINYINT(1),
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('product', 'por_metros_cuadrados');
  },
};
