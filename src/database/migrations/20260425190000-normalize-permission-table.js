'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Asegurarse de que id_permiso esté correctamente enlazado antes de eliminar permiss
    //    Sincronizar cualquier registro que aún tenga id_permiso NULL
    await queryInterface.sequelize.query(`
      UPDATE permission p
      INNER JOIN permission_catalog pc
        ON p.permiss COLLATE utf8mb4_unicode_ci = pc.name COLLATE utf8mb4_unicode_ci
      SET p.id_permiso = pc.id
      WHERE p.id_permiso IS NULL
    `);

    // 2. Eliminar registros sin id_permiso (no válidos en la nueva estructura)
    await queryInterface.sequelize.query(
      `DELETE FROM permission WHERE id_permiso IS NULL`
    );

    // 3. Hacer id_permiso NOT NULL con FK formal
    const tableDesc = await queryInterface.describeTable('permission');

    await queryInterface.changeColumn('permission', 'id_permiso', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'permission_catalog',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    // 4. Eliminar la columna permiss (texto) que ya no es necesaria
    if (tableDesc.permiss) {
      await queryInterface.removeColumn('permission', 'permiss');
    }
  },

  async down(queryInterface, Sequelize) {
    // Restaurar columna permiss
    const tableDesc = await queryInterface.describeTable('permission');
    if (!tableDesc.permiss) {
      await queryInterface.addColumn('permission', 'permiss', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });

      // Recuperar nombre desde el catálogo
      await queryInterface.sequelize.query(`
        UPDATE permission p
        INNER JOIN permission_catalog pc ON p.id_permiso = pc.id
        SET p.permiss = pc.name
      `);

      await queryInterface.changeColumn('permission', 'permiss', {
        type: Sequelize.STRING(255),
        allowNull: false,
      });
    }

    // Volver id_permiso a nullable
    await queryInterface.changeColumn('permission', 'id_permiso', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },
};
