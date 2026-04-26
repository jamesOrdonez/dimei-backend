'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop old orphaned tables if they exist from the previous attempt
    await queryInterface.dropTable('contact_supplier').catch(() => {});
    await queryInterface.dropTable('supplier').catch(() => {});
    
    try {
      await queryInterface.sequelize.query(`DELETE FROM SequelizeMeta WHERE name LIKE '%supplier%'`);
    } catch(e) {}

    await queryInterface.addColumn('client', 'tipo', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'cliente'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('client', 'tipo');
  }
};
