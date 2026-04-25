'use strict';

/**
 * Seeder: permission_catalog
 * Inserta los permisos maestros del sistema.
 * Es idempotente: inserta solo los que no existen.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const catalogPermissions = [
      { id: 1, name: 'Acceso a ingresar material',     description: 'Permite registrar ingreso de material al inventario' },
      { id: 2, name: 'Hacer remisiones de proyectos',  description: 'Permite hacer remisiones de productos e ítems en proyectos' },
      { id: 3, name: 'Crear ítems',                    description: 'Permite crear y gestionar ítems del inventario' },
      { id: 4, name: 'Crear productos',                description: 'Permite crear y gestionar productos' },
      { id: 5, name: 'Crear proyectos',                description: 'Permite crear, iniciar y cerrar proyectos' },
      { id: 6, name: 'Consultar listas de compras',    description: 'Permite ver el análisis comparativo de inventario' },
      { id: 7, name: 'Anexar actas de entrega',        description: 'Permite cargar y gestionar actas de entrega firmadas' },
      { id: 8, name: 'Pedir material adicional',       description: 'Permite solicitar ítems adicionales en proyectos' },
      { id: 9, name: 'Visualizar proyectos',           description: 'Permite ver el detalle de proyectos en modo solo lectura' },
    ];

    // Obtener los nombres ya existentes para no duplicar
    const existing = await queryInterface.sequelize.query(
      'SELECT name FROM permission_catalog',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const existingNames = existing.map(r => r.name);

    const toInsert = catalogPermissions.filter(p => !existingNames.includes(p.name));

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert('permission_catalog', toInsert, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('permission_catalog', null, {});
  },
};
