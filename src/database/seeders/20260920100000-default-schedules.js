'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Obtener roles existentes
    const roles = await queryInterface.sequelize.query(
      'SELECT id, name, company FROM rol WHERE state = 1;',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!roles || roles.length === 0) return;

    for (const r of roles) {
      // Verificar si ya tiene horario
      const existing = await queryInterface.sequelize.query(
        'SELECT id FROM rol_schedule WHERE rol_id = :rol_id AND company = :company LIMIT 1;',
        {
          replacements: { rol_id: r.id, company: r.company },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (!existing || existing.length === 0) {
        await queryInterface.bulkInsert('rol_schedule', [
          {
            rol_id: r.id,
            company: r.company,
            entry_time: '07:00:00',
            lunch_start: '12:00:00',
            lunch_end: '13:00:00',
            exit_time: '17:00:00',
            saturday_entry_time: '07:00:00',
            saturday_exit_time: '12:00:00',
          },
        ]);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('rol_schedule', null, {});
  },
};
