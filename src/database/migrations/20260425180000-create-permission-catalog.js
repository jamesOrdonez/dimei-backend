'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Crear tabla maestra de permisos si no existe
    const tables = await queryInterface.showAllTables();
    
    if (!tables.includes('permission_catalog')) {
      await queryInterface.createTable('permission_catalog', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        name: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true,
          comment: 'Nombre literal del permiso, ej: "Crear proyectos"',
        },
        description: {
          type: Sequelize.STRING(500),
          allowNull: true,
        },
      });
    }

    // 2. Agregar columna id_permiso a la tabla permission si no existe
    const tableDesc = await queryInterface.describeTable('permission');

    if (!tableDesc.id_permiso) {
      await queryInterface.addColumn('permission', 'id_permiso', {
        type: Sequelize.INTEGER,
        allowNull: true, // temporal, se llenará con datos
        references: {
          model: 'permission_catalog',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Revertir: quitar id_permiso de permission y eliminar permission_catalog
    const tableDesc = await queryInterface.describeTable('permission');
    if (tableDesc.id_permiso) {
      await queryInterface.removeColumn('permission', 'id_permiso');
    }

    const tables = await queryInterface.showAllTables();
    if (tables.includes('permission_catalog')) {
      await queryInterface.dropTable('permission_catalog');
    }
  },
};
