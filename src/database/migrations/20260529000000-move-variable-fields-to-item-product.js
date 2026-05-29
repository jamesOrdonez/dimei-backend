'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const itemProduct = await queryInterface.describeTable('item_product');

    // Add variable, value1, value2 to item_product
    if (!itemProduct.variable) {
      await queryInterface.addColumn('item_product', 'variable', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      });
    }
    if (!itemProduct.value1) {
      await queryInterface.addColumn('item_product', 'value1', {
        type: Sequelize.FLOAT,
        allowNull: true,
      });
    }
    if (!itemProduct.value2) {
      await queryInterface.addColumn('item_product', 'value2', {
        type: Sequelize.FLOAT,
        allowNull: true,
      });
    }

    // Remove variable, value1, value2 from product (they now live on item_product)
    const product = await queryInterface.describeTable('product');
    if (product.variable) {
      await queryInterface.removeColumn('product', 'variable');
    }
    if (product.value1) {
      await queryInterface.removeColumn('product', 'value1');
    }
    if (product.value2) {
      await queryInterface.removeColumn('product', 'value2');
    }
  },

  async down(queryInterface, Sequelize) {
    // Reverse: remove from item_product
    await queryInterface.removeColumn('item_product', 'variable');
    await queryInterface.removeColumn('item_product', 'value1');
    await queryInterface.removeColumn('item_product', 'value2');

    // Restore to product
    await queryInterface.addColumn('product', 'variable', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('product', 'value1', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
    await queryInterface.addColumn('product', 'value2', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
  },
};
