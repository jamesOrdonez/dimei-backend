'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Obtener el ID del permiso "Pedir material adicional"
    const [insertedPerms] = await queryInterface.sequelize.query(
      `SELECT id FROM permission_catalog WHERE name = 'Pedir material adicional'`
    );
    
    if (!insertedPerms || insertedPerms.length === 0) {
      console.warn('[seeder] No se encontró el permiso "Pedir material adicional" en el catálogo.');
      return;
    }
    
    const permId = insertedPerms[0].id;

    // 2. Obtener todos los roles "Almacenista" (junto a su empresa)
    const [almacenistas] = await queryInterface.sequelize.query(
      `SELECT id, company FROM rol WHERE name = 'Almacenista'`
    );

    // 3. Asignar el permiso al rol de Almacenista
    for (const almacenista of almacenistas) {
      // Verificar si ya lo tiene para no duplicar
      const [hasPerm] = await queryInterface.sequelize.query(
        `SELECT id FROM permission WHERE rol = ${almacenista.id} AND id_permiso = ${permId}`
      );
      
      if (!hasPerm || hasPerm.length === 0) {
        await queryInterface.sequelize.query(
          `INSERT INTO permission (rol, company, id_permiso) VALUES (${almacenista.id}, ${almacenista.company}, ${permId})`
        );
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Si quisieramos revertir, eliminaríamos del catálogo y de las asignaciones
  }
};
