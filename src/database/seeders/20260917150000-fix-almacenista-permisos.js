'use strict';

/**
 * Seeder: fix-almacenista-permisos
 *
 * Elimina los permisos "Crear ítems" y "Editar ítems" del rol "Almacenista".
 * El rol "Almacenista" solo puede consultar/usar ítems, no crearlos ni editarlos.
 * Esas acciones son exclusivas del "Jefe de Almacen".
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Obtener IDs de los permisos a quitar
    const [permsToRemove] = await queryInterface.sequelize.query(
      `SELECT id FROM permission_catalog WHERE name IN ('Crear ítems', 'Editar ítems')`
    );

    if (!permsToRemove || permsToRemove.length === 0) {
      console.warn('[seeder] No se encontraron los permisos en el catálogo.');
      return;
    }

    const permIds = permsToRemove.map(p => p.id).join(',');

    // Obtener IDs de todos los roles "Almacenista"
    const [almacenistas] = await queryInterface.sequelize.query(
      `SELECT id FROM rol WHERE name = 'Almacenista'`
    );

    if (!almacenistas || almacenistas.length === 0) {
      console.warn('[seeder] No se encontró el rol "Almacenista".');
      return;
    }

    const rolIds = almacenistas.map(r => r.id).join(',');

    // Eliminar esos permisos del Almacenista
    const [result] = await queryInterface.sequelize.query(
      `DELETE FROM permission WHERE rol IN (${rolIds}) AND id_permiso IN (${permIds})`
    );

    console.log(`[seeder] Permisos "Crear ítems" y "Editar ítems" eliminados del rol Almacenista. Filas afectadas: ${result.affectedRows}`);
  },

  async down(queryInterface, Sequelize) {
    // Revertir: volver a asignar "Crear ítems" al Almacenista
    // (Editar ítems NO se restaura, ya que nunca debió tenerlo)
    const [[crearPerm]] = await queryInterface.sequelize.query(
      `SELECT id FROM permission_catalog WHERE name = 'Crear ítems'`
    );
    if (!crearPerm) return;

    const [almacenistas] = await queryInterface.sequelize.query(
      `SELECT id, company FROM rol WHERE name = 'Almacenista'`
    );

    for (const { id, company } of almacenistas) {
      const [exists] = await queryInterface.sequelize.query(
        `SELECT id FROM permission WHERE rol = ${id} AND id_permiso = ${crearPerm.id}`
      );
      if (!exists || exists.length === 0) {
        await queryInterface.sequelize.query(
          `INSERT INTO permission (rol, company, id_permiso) VALUES (${id}, ${company}, ${crearPerm.id})`
        );
      }
    }
  },
};
