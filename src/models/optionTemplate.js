const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

const OptionTemplate = sequelize.define(
  "OptionTemplate",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    group_id: { type: DataTypes.INTEGER, allowNull: false },
    text: { type: DataTypes.STRING(200), allowNull: false },
    requires_photo: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
    sort_order: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
  },
  { tableName: "option_template", timestamps: false }
);

module.exports = OptionTemplate;
