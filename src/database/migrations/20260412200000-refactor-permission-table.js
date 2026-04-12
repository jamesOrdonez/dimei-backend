'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('permission');

    // Agregar columna 'company' si no existe
    if (!tableDesc.company) {
      await queryInterface.addColumn('permission', 'company', {
        type: Sequelize.INTEGER,
        allowNull: true, // Temporal para no romper datos existentes
        defaultValue: 1,
      });
      // Actualizar registros existentes
      await queryInterface.sequelize.query(
        "UPDATE permission SET company = 1 WHERE company IS NULL"
      );
      // Hacer NOT NULL
      await queryInterface.changeColumn('permission', 'company', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      });
    }

    // Eliminar columna 'module' si existe
    if (tableDesc.module) {
      await queryInterface.removeColumn('permission', 'module');
    }

    // Limpiar todos los permisos HTTP antiguos (GET, POST, PUT, DELETE)
    // Los permisos literales los creará el seed
    await queryInterface.sequelize.query(
      "DELETE FROM permission WHERE permiss IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')"
    );
  },

  async down(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('permission');

    if (!tableDesc.module) {
      await queryInterface.addColumn('permission', 'module', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    if (tableDesc.company) {
      await queryInterface.removeColumn('permission', 'company');
    }
  },
};
