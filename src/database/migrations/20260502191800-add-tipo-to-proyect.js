'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('proyect', 'tipo', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'proyecto'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('proyect', 'tipo');
  }
};
