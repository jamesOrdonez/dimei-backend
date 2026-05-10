'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const newPermissions = [
      { name: 'Ver herramientas y préstamos', description: 'Permite visualizar el listado de herramientas y los préstamos registrados' },
      { name: 'Crear herramientas', description: 'Permite registrar nuevas herramientas en el sistema' },
      { name: 'Crear préstamos de herramientas', description: 'Permite registrar un préstamo de herramientas a empleados' },
      { name: 'Devolver herramientas', description: 'Permite registrar la devolución de herramientas prestadas' },
    ];

    // 1. Insertar permisos en el catálogo si no existen
    for (const perm of newPermissions) {
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id FROM permission_catalog WHERE name = '${perm.name}'`
      );
      if (!existing || existing.length === 0) {
        await queryInterface.sequelize.query(
          `INSERT INTO permission_catalog (name, description) VALUES ('${perm.name}', '${perm.description}')`
        );
      }
    }

    // 2. Obtener los IDs de estos permisos recién insertados o existentes
    const [insertedPerms] = await queryInterface.sequelize.query(
      `SELECT id FROM permission_catalog WHERE name IN (${newPermissions.map(p => `'${p.name}'`).join(',')})`
    );
    const permIds = insertedPerms.map(p => p.id);

    // 3. Obtener todos los roles "Almacenista" (junto a su empresa)
    const [almacenistas] = await queryInterface.sequelize.query(
      `SELECT id, company FROM rol WHERE name = 'Almacenista'`
    );

    // 4. Asignar los permisos al rol de Almacenista
    for (const almacenista of almacenistas) {
      for (const permId of permIds) {
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
    }
  },

  async down(queryInterface, Sequelize) {
    // Si quisieramos revertir, eliminaríamos del catálogo y de las asignaciones
  }
};
