'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('remision_item', 'status', {
      type: Sequelize.ENUM('Completo', 'Pendiente'),
      allowNull: false,
      defaultValue: 'Completo',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('remision_item', 'status');
    // Para MySQL, opcionalmente se podría eliminar el tipo enum si fuera necesario, 
    // pero removeColumn es suficiente para la tabla.
  }
};
