'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Obtener todas las compañías existentes (basado en los roles actuales)
    const [companiesResults] = await queryInterface.sequelize.query('SELECT DISTINCT company FROM rol');
    const companies = companiesResults.map(r => r.company);

    const baseRoles = [
      { name: 'Administrador', editable: 0 },
      { name: 'Técnicos', editable: 0 },
      { name: 'Almacenista', editable: 0 },
      { name: 'Diseñador', editable: 0 }
    ];

    // Para cada compañía, asegurarse de que los roles base existan y no sean editables
    for (const company of companies) {
      for (const role of baseRoles) {
        const [existing] = await queryInterface.sequelize.query(
          `SELECT id FROM rol WHERE name = '${role.name}' AND company = ${company}`
        );

        if (existing && existing.length > 0) {
          // Si existe, actualizar editable a false (0)
          await queryInterface.sequelize.query(
            `UPDATE rol SET editable = 0 WHERE id = ${existing[0].id}`
          );
        } else {
          // Si no existe, crearlo
          await queryInterface.sequelize.query(
            `INSERT INTO rol (name, state, company, editable) VALUES ('${role.name}', 1, ${company}, 0)`
          );
        }
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Restaurar a editable true
    await queryInterface.sequelize.query(`UPDATE rol SET editable = 1`);
  }
};
