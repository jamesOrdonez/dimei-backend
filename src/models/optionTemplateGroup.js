const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

const OptionTemplateGroup = sequelize.define(
  "OptionTemplateGroup",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    company: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: "option_template_group", timestamps: false }
);

module.exports = OptionTemplateGroup;
