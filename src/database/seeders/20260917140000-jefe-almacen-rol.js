'use strict';

/**
 * Seeder: jefe-almacen-rol
 *
 * 1. Agrega el permiso "Editar ítems" al catálogo (si no existe).
 * 2. Asigna "Editar ítems" a todos los roles que ya tenían "Crear ítems"
 *    (para no romper el comportamiento existente de quienes ya podían editar).
 * 3. Renombra el rol "Almacenista" a "Jefe de Almacen" en todas las compañías.
 * 4. Crea el nuevo rol "Almacenista" (editable = 0) para cada compañía,
 *    copiando todos los permisos del "Jefe de Almacen" EXCEPTO "Editar ítems".
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ── 1. Agregar "Editar ítems" al catálogo ────────────────────────────────
    const [existingCatalog] = await queryInterface.sequelize.query(
      `SELECT id FROM permission_catalog WHERE name = 'Editar ítems'`
    );

    if (!existingCatalog || existingCatalog.length === 0) {
      await queryInterface.sequelize.query(
        `INSERT INTO permission_catalog (name, description)
         VALUES ('Editar ítems', 'Permite modificar los datos de ítems existentes en el inventario')`
      );
    }

    // Obtener el id del permiso "Editar ítems"
    const [[editarItemsPerm]] = await queryInterface.sequelize.query(
      `SELECT id FROM permission_catalog WHERE name = 'Editar ítems'`
    );
    const editarItemsId = editarItemsPerm.id;

    // Obtener el id del permiso "Crear ítems"
    const [[crearItemsPerm]] = await queryInterface.sequelize.query(
      `SELECT id FROM permission_catalog WHERE name = 'Crear ítems'`
    );
    const crearItemsId = crearItemsPerm ? crearItemsPerm.id : null;

    // ── 2. Asignar "Editar ítems" a todos los roles que tienen "Crear ítems" ──
    //       Así los roles existentes (Administrador, Jefe de Almacen, etc.)
    //       no pierden la capacidad de editar ítems.
    if (crearItemsId) {
      const [rolesConCrearItems] = await queryInterface.sequelize.query(
        `SELECT rol, company FROM permission WHERE id_permiso = ${crearItemsId}`
      );

      for (const { rol, company } of rolesConCrearItems) {
        const [yaExiste] = await queryInterface.sequelize.query(
          `SELECT id FROM permission WHERE rol = ${rol} AND company = ${company} AND id_permiso = ${editarItemsId}`
        );
        if (!yaExiste || yaExiste.length === 0) {
          await queryInterface.sequelize.query(
            `INSERT INTO permission (rol, company, id_permiso) VALUES (${rol}, ${company}, ${editarItemsId})`
          );
        }
      }
    }

    // ── 3. Renombrar "Almacenista" → "Jefe de Almacen" ──────────────────────
    await queryInterface.sequelize.query(
      `UPDATE rol SET name = 'Jefe de Almacen' WHERE name = 'Almacenista'`
    );

    // ── 4. Crear el nuevo rol "Almacenista" por compañía ────────────────────
    const [companies] = await queryInterface.sequelize.query(
      `SELECT DISTINCT company FROM rol`
    );

    for (const { company } of companies) {
      // Verificar que no exista ya un "Almacenista" (idempotente)
      const [existingAlmacenista] = await queryInterface.sequelize.query(
        `SELECT id FROM rol WHERE name = 'Almacenista' AND company = ${company}`
      );
      if (existingAlmacenista && existingAlmacenista.length > 0) {
        console.log(`[seeder] Rol "Almacenista" ya existe para company=${company}, omitiendo.`);
        continue;
      }

      // Obtener el "Jefe de Almacen" de esa compañía
      const [jefeRows] = await queryInterface.sequelize.query(
        `SELECT id FROM rol WHERE name = 'Jefe de Almacen' AND company = ${company}`
      );
      if (!jefeRows || jefeRows.length === 0) {
        console.warn(`[seeder] No se encontró "Jefe de Almacen" para company=${company}.`);
        continue;
      }
      const jefeId = jefeRows[0].id;

      // Crear el nuevo rol "Almacenista" (no editable, igual que los roles base)
      await queryInterface.sequelize.query(
        `INSERT INTO rol (name, state, company, editable) VALUES ('Almacenista', 1, ${company}, 0)`
      );

      // Obtener el id del nuevo rol recién creado
      const [[newAlmacenista]] = await queryInterface.sequelize.query(
        `SELECT id FROM rol WHERE name = 'Almacenista' AND company = ${company} ORDER BY id DESC LIMIT 1`
      );
      const newRolId = newAlmacenista.id;

      // Copiar los permisos del Jefe de Almacen al nuevo Almacenista,
      // EXCEPTO "Editar ítems" y "Crear ítems"
      const [jefePermisos] = await queryInterface.sequelize.query(
        `SELECT p.id_permiso FROM permission p
         WHERE p.rol = ${jefeId} AND p.company = ${company}
           AND p.id_permiso NOT IN (
             SELECT id FROM permission_catalog WHERE name IN ('Editar ítems', 'Crear ítems')
           )`
      );

      for (const { id_permiso } of jefePermisos) {
        await queryInterface.sequelize.query(
          `INSERT INTO permission (rol, company, id_permiso) VALUES (${newRolId}, ${company}, ${id_permiso})`
        );
      }

      console.log(`[seeder] Rol "Almacenista" creado para company=${company} con ${jefePermisos.length} permisos (sin Editar ítems).`);
    }

    console.log('[seeder] Migracion Jefe de Almacen / Almacenista completada.');
  },

  async down(queryInterface, Sequelize) {
    // Revertir: eliminar los nuevos roles "Almacenista"
    // y renombrar "Jefe de Almacen" de vuelta a "Almacenista"
    const [newAlmacenistas] = await queryInterface.sequelize.query(
      `SELECT id FROM rol WHERE name = 'Almacenista'`
    );
    for (const { id } of newAlmacenistas) {
      await queryInterface.sequelize.query(`DELETE FROM permission WHERE rol = ${id}`);
      await queryInterface.sequelize.query(`DELETE FROM rol WHERE id = ${id}`);
    }

    await queryInterface.sequelize.query(
      `UPDATE rol SET name = 'Almacenista' WHERE name = 'Jefe de Almacen'`
    );

    // Eliminar "Editar ítems" del catálogo y sus asignaciones
    const [editarItemsRows] = await queryInterface.sequelize.query(
      `SELECT id FROM permission_catalog WHERE name = 'Editar ítems'`
    );
    if (editarItemsRows && editarItemsRows.length > 0) {
      const editarItemsId = editarItemsRows[0].id;
      await queryInterface.sequelize.query(
        `DELETE FROM permission WHERE id_permiso = ${editarItemsId}`
      );
      await queryInterface.sequelize.query(
        `DELETE FROM permission_catalog WHERE id = ${editarItemsId}`
      );
    }
  },
};
