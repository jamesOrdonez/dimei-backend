'use strict';

/**
 * Seeder: privileges (tabla permission)
 *
 * Sincroniza id_permiso en los registros existentes de la tabla permission
 * haciendo JOIN por el campo permiss (texto) con permission_catalog.name.
 *
 * Luego, asigna el nuevo permiso "Visualizar proyectos" (id=9) a los roles
 * que tienen al menos alguno de los permisos de Proyectos:
 *   - Almacenista (rol 3): recibe "Visualizar proyectos" si tiene "Crear ítems" o "Hacer remisiones"
 *   - Diseñador (rol 4 según la imagen): ya tiene "Crear proyectos", no necesita VER_PROYECTOS
 *   - Roles con "Consultar listas de compras": reciben "Visualizar proyectos"
 *
 * Ajusta los ids de rol según los roles reales de tu base de datos.
 *
 * ESTRATEGIA SEGURA:
 * 1. Leer permission_catalog para obtener el mapa nombre->id
 * 2. Actualizar id_permiso en todos los registros permission que tengan permiss coincidente
 * 3. Insertar el privilegio "Visualizar proyectos" para los roles que tienen
 *    "Hacer remisiones de proyectos" o "Crear proyectos" (es decir, acceden a proyectos)
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Obtener catálogo completo
    const catalog = await queryInterface.sequelize.query(
      'SELECT id, name FROM permission_catalog',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (catalog.length === 0) {
      console.warn('[seeder] permission_catalog vacío — corre primero el seeder de catálogo.');
      return;
    }

    const nameToId = {};
    catalog.forEach(p => { nameToId[p.name] = p.id; });

    // 2. Actualizar id_permiso en los registros existentes de permission
    for (const [name, id] of Object.entries(nameToId)) {
      await queryInterface.sequelize.query(
        `UPDATE permission SET id_permiso = :id WHERE permiss = :name AND id_permiso IS NULL`,
        { replacements: { id, name } }
      );
    }

    // 3. Insertar "Visualizar proyectos" para roles que tienen acceso a proyectos
    //    pero aún no tienen ese privilegio.
    //    Criterio: roles que ya tienen "Crear proyectos" O "Hacer remisiones de proyectos"
    const verProyectosId = nameToId['Visualizar proyectos'];
    if (!verProyectosId) {
      console.warn('[seeder] No se encontró "Visualizar proyectos" en el catálogo.');
      return;
    }

    // Obtener los roles+company que tienen acceso a proyectos
    const rolesWithProjects = await queryInterface.sequelize.query(
      `SELECT DISTINCT p.rol, p.company
       FROM permission p
       WHERE p.permiss IN ('Crear proyectos', 'Hacer remisiones de proyectos')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (const { rol, company } of rolesWithProjects) {
      // Verificar si ya tiene el privilegio de ver proyectos
      const existing = await queryInterface.sequelize.query(
        `SELECT id FROM permission WHERE rol = :rol AND company = :company AND permiss = 'Visualizar proyectos'`,
        { replacements: { rol, company }, type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      if (existing.length === 0) {
        await queryInterface.bulkInsert('permission', [{
          rol,
          company,
          permiss: 'Visualizar proyectos',
          id_permiso: verProyectosId,
        }]);
      }
    }

    console.log('[seeder] Privilegios sincronizados correctamente.');
  },

  async down(queryInterface, Sequelize) {
    // Limpiar solo el permiso nuevo agregado por este seeder
    await queryInterface.sequelize.query(
      `DELETE FROM permission WHERE permiss = 'Visualizar proyectos'`
    );
    // Limpiar id_permiso (dejar NULL)
    await queryInterface.sequelize.query(
      `UPDATE permission SET id_permiso = NULL`
    );
  },
};
