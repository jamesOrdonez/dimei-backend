const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const conection = require("../db/conection");
const httpStatus = require("http-status");
const Module = "login";

async function login(req, res){
    try {
        const { user, password } = req.body;

        if(!user || !password){
            res.status(httpStatus.BAD_REQUEST).json({
                message: "Usuario y contraseña obligatorios"
            })
        }

        const [query] = await conection.execute(`SELECT * FROM user u join company c on c.id = u.company WHERE u.state = 1 AND u.user = ?`, [user]);
        if(query){
            console.log(query);
            const userId = query[0].id;
            const user = query[0].user;
            const passwordEncripted = query[0].password;
            const rolId = query[0].rol;
            const company = query[0].company

            const validatePass = await bcrypt.compare(password, passwordEncripted);

            if(!validatePass){
                res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                    message: "Contraseña incorrecta"
                })
            }else{
                const token = jwt.sign(
                    {
                        userId: userId,
                        user: user,
                        rolId: rolId,
                        company: company
                    },
                    "super_secret", 
                    {
                      expiresIn: "8h",
                    }
                )
                return res.status(httpStatus.OK).json({ token, userId, user, rolId, company });
            };

        }
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error interno en el servidor: ${error}`,
            module: Module
        })
    }
}

module.exports = {
    login
}