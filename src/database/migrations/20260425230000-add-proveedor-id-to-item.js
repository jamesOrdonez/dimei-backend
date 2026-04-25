'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('item', 'proveedor_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'client', // The table name is 'client' where proveedores are stored
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('item', 'proveedor_id');
  }
};
