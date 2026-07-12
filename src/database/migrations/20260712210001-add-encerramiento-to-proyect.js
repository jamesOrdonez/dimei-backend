'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('proyect', 'necesita_encerramiento', {
      type: Sequelize.TINYINT(1),
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('proyect', 'metros_cuadrados', {
      type: Sequelize.FLOAT,
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('proyect', 'necesita_encerramiento');
    await queryInterface.removeColumn('proyect', 'metros_cuadrados');
  },
};
