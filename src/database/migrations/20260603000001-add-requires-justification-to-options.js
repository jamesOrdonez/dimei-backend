'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('answer_option', 'requires_justification', {
      type: Sequelize.TINYINT,
      allowNull: false,
      defaultValue: 0,
      after: 'requires_photo'
    });

    await queryInterface.addColumn('option_template', 'requires_justification', {
      type: Sequelize.TINYINT,
      allowNull: false,
      defaultValue: 0,
      after: 'requires_photo'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('answer_option', 'requires_justification');
    await queryInterface.removeColumn('option_template', 'requires_justification');
  }
};
