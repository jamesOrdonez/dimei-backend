const conection = require("../db/conection");
const bcrypt = require("bcryptjs");
const httpStatus = require('http-status');
const Module = "user";

async function saveUser(req,res){
    try {
        const { name, rol, user, password, state } = req.body;
        const passEncripted = await bcrypt.hash(password, 8);

        const saveUser = await conection.execute(`INSERT INTO user (name, rol, user, password, state) VALUES (?, ?, ?, ?, ?)`,
        [name, rol, user, passEncripted, state]);

        if (saveUser) {
            res.status(httpStatus.CREATED).json({
                message: "Usuario creado exitosamente",
                module: Module
            });
        }
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error interno en el servidor: ${error}`,
            module: Module
        })
    }
};

module.exports = {
    saveUser
}