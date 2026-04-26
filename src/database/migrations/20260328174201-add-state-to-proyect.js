'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable('proyect');
    if (!tableDefinition.state) {
      await queryInterface.addColumn('proyect', 'state', {
        type: Sequelize.ENUM('Creado', 'Iniciado', 'Finalizado', 'Cancelado'),
        allowNull: false,
        defaultValue: 'Creado',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('proyect', 'state');
  }
};
