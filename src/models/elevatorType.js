const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

const ElevatorType = sequelize.define(
  "elevatorType",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    elevatorType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    company: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    question_group_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  },
);

const QuestionGroup = require('./questionGroup');
ElevatorType.belongsTo(QuestionGroup, { foreignKey: 'question_group_id', as: 'questionGroup' });
QuestionGroup.hasMany(ElevatorType, { foreignKey: 'question_group_id', as: 'elevatorTypes' });

module.exports = ElevatorType;
