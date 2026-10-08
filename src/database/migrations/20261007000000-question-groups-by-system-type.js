'use strict';

/**
 * Reestructura la asignación de preguntas de mantenimiento:
 *  - Cada grupo de preguntas pertenece a un tipo de sistema (question_group.elevator_type_id).
 *  - Los grupos se asignan a cada equipo (tabla pivote proyect_question_group, N:M).
 *
 * Migra los datos existentes:
 *  - elevatorType.question_group_id  -> question_group.elevator_type_id
 *  - proyect.elevatorType (con grupo) -> proyect_question_group
 *
 * Nota: la columna elevatorType.question_group_id se conserva (deprecada) para no perder datos.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Tipo de sistema en el grupo de preguntas
    const qgInfo = await queryInterface.describeTable('question_group');
    if (!qgInfo.elevator_type_id) {
      await queryInterface.addColumn('question_group', 'elevator_type_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
      await queryInterface.addIndex('question_group', ['elevator_type_id'], {
        name: 'idx_question_group_elevator_type',
      });
    }

    // 2. Tabla pivote equipo <-> grupo de preguntas
    const tables = await queryInterface.showAllTables();
    const tableNames = tables.map((t) => (typeof t === 'string' ? t : t.tableName));
    if (!tableNames.includes('proyect_question_group')) {
      await queryInterface.createTable('proyect_question_group', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        proyect_id: { type: Sequelize.INTEGER, allowNull: false },
        question_group_id: { type: Sequelize.INTEGER, allowNull: false },
      });
      await queryInterface.addIndex('proyect_question_group', ['proyect_id', 'question_group_id'], {
        unique: true,
        name: 'uq_proyect_question_group',
      });
      await queryInterface.addIndex('proyect_question_group', ['question_group_id'], {
        name: 'idx_pqg_question_group',
      });
    }

    // 3. Migración de datos existentes
    const etInfo = await queryInterface.describeTable('elevatorType');
    if (etInfo.question_group_id) {
      await queryInterface.sequelize.query(`
        UPDATE question_group qg
        INNER JOIN elevatorType et ON et.question_group_id = qg.id
        SET qg.elevator_type_id = et.id
        WHERE qg.elevator_type_id IS NULL
      `);

      await queryInterface.sequelize.query(`
        INSERT IGNORE INTO proyect_question_group (proyect_id, question_group_id)
        SELECT p.id, et.question_group_id
        FROM proyect p
        INNER JOIN elevatorType et ON et.id = p.elevatorType
        WHERE et.question_group_id IS NOT NULL
      `);
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('proyect_question_group');
    const qgInfo = await queryInterface.describeTable('question_group');
    if (qgInfo.elevator_type_id) {
      await queryInterface.removeIndex('question_group', 'idx_question_group_elevator_type').catch(() => {});
      await queryInterface.removeColumn('question_group', 'elevator_type_id');
    }
  },
};
