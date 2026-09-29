'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Tabla: rol_schedule (Horarios laborales configurados por Rol)
    await queryInterface.createTable('rol_schedule', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      rol_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'rol',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      company: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      entry_time: {
        type: Sequelize.TIME,
        allowNull: false,
        comment: 'Hora esperada de entrada (Lunes a Viernes)',
      },
      lunch_start: {
        type: Sequelize.TIME,
        allowNull: true,
        comment: 'Inicio estimado de almuerzo',
      },
      lunch_end: {
        type: Sequelize.TIME,
        allowNull: true,
        comment: 'Fin estimado de almuerzo',
      },
      exit_time: {
        type: Sequelize.TIME,
        allowNull: false,
        comment: 'Hora esperada de salida (Lunes a Viernes)',
      },
      saturday_entry_time: {
        type: Sequelize.TIME,
        allowNull: true,
        comment: 'Hora esperada de entrada los Sábados',
      },
      saturday_exit_time: {
        type: Sequelize.TIME,
        allowNull: true,
        comment: 'Hora esperada de salida los Sábados',
      },
    });

    await queryInterface.addConstraint('rol_schedule', {
      fields: ['rol_id', 'company'],
      type: 'unique',
      name: 'uq_rol_schedule_rol_company',
    });

    // 2. Tabla: time_record (Registros diarios consolidados por usuario)
    await queryInterface.createTable('time_record', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'user',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      company: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      record_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Fecha del día laborado (YYYY-MM-DD)',
      },
      entry_time: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Marca de llegada real',
      },
      lunch_start: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Marca de salida a almuerzo',
      },
      lunch_end: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Marca de regreso de almuerzo',
      },
      exit_time: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Marca de salida de labores',
      },
      is_holiday: {
        type: Sequelize.TINYINT,
        defaultValue: 0,
        comment: '1 si fue marcado como festivo/dominical',
      },
      overtime_justification: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Justificación del técnico si generó horas extra',
      },
      lunch_omitted: {
        type: Sequelize.TINYINT,
        defaultValue: 0,
        comment: '1 si omitió el almuerzo',
      },
      lunch_justification: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Justificación al omitir el almuerzo',
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addConstraint('time_record', {
      fields: ['user_id', 'record_date'],
      type: 'unique',
      name: 'uq_time_record_user_date',
    });

    // 3. Tabla: time_marking_logs (Auditoría de marcaciones con foto y GPS)
    await queryInterface.createTable('time_marking_logs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      time_record_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'time_record',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'user',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      company: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      marking_type: {
        type: Sequelize.STRING(30),
        allowNull: false,
        comment: 'entry | lunch_start | lunch_end | exit',
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      photo_url: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Ruta de la fotografía capturada',
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true,
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true,
      },
      accuracy: {
        type: Sequelize.FLOAT,
        allowNull: true,
        comment: 'Precisión del GPS en metros',
      },
      justification: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('time_marking_logs');
    await queryInterface.dropTable('time_record');
    await queryInterface.dropTable('rol_schedule');
  },
};
