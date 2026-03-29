const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

const Company = require("./company");
const Rol = require("./rol");


const User = sequelize.define("User", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },

    name: { type: DataTypes.STRING, allowNull: false },
    rol: { type: DataTypes.INTEGER, allowNull: false },
    user: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    state: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    company: { type: DataTypes.INTEGER, allowNull: false },
}, {
    tableName: "user",
    timestamps: false,
});

User.belongsTo(Company, { foreignKey: "company" });
Company.hasMany(User, { foreignKey: "company" });

User.belongsTo(Rol, { foreignKey: "rol" });
Rol.hasMany(User, { foreignKey: "rol" });


module.exports = User;