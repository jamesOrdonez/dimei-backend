'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Nullify existing binary data to avoid conversion errors
    await queryInterface.bulkUpdate('item', { img: null }, {});
    
    await queryInterface.changeColumn('item', 'img', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('item', 'img', {
      type: Sequelize.BLOB("long"),
      allowNull: true,
    });
  }
};
