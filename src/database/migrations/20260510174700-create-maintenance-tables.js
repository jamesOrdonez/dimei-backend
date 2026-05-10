'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('maintenance_report', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'proyect', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      technician_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'user', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      customer_signature: {
        type: Sequelize.TEXT('long'),
        allowNull: false
      },
      technician_signature: {
        type: Sequelize.TEXT('long'),
        allowNull: false
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'Finalizado'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.createTable('maintenance_answer', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      maintenance_report_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'maintenance_report', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      question_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'question', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      answer_text: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      selected_options: {
        type: Sequelize.JSON,
        allowNull: true
      },
      photos: {
        type: Sequelize.JSON,
        allowNull: true
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('maintenance_answer');
    await queryInterface.dropTable('maintenance_report');
  }
};
