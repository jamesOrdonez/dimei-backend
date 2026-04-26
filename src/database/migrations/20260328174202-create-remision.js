'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.showAllTables()
      .then(tables => tables.includes('remision'));

    if (!tableExists) {
      await queryInterface.createTable('remision', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        description: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        fkUser: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        date: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        company: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        fk_proyect: {
          type: Sequelize.INTEGER,
          allowNull: true,
        }
      });
    } else {
      const tableDefinition = await queryInterface.describeTable('remision');
      
      // Asegurarse de que date existe si no está
      if (!tableDefinition.date) {
        await queryInterface.addColumn('remision', 'date', {
          type: Sequelize.DATE,
          allowNull: true,
        });
      }

      // Agregar fk_proyect
      if (!tableDefinition.fk_proyect) {
        await queryInterface.addColumn('remision', 'fk_proyect', {
          type: Sequelize.INTEGER,
          allowNull: true,
        });
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Si la tabla fue creada por nosotros, podríamos borrarla, 
    // pero para seguridad en bases de datos existentes, a menudo solo removemos lo que agregamos.
    const tableDefinition = await queryInterface.describeTable('remision');
    if (tableDefinition.fk_proyect) {
      await queryInterface.removeColumn('remision', 'fk_proyect');
    }
    // No borramos la tabla ni la columna 'date' para evitar pérdida de datos si ya existían.
  }
};
