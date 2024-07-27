const httpStatus = require('http-status');
const conection = require('../db/conection');
const Module = 'permission';

async function getPermissRol(req,res){
    try {
        const permiss = await conection.execute(`select u.name, r.name,m.module,p.permiss from user u join rol r on u.rol = r.id join permission p on p.rol = r.id join module m on m.id = p.module order by p.id desc`);

        if(permiss){
            res.status(httpStatus.OK).json({
                data: permiss,
                module: Module
            });
        }
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error interno en el servidor: ${error}`,
            module: Module,
        });
    }
};

async function savePermission(req, res){
    try {
        const { permiss, modules, rol } = req.body;
        const save = await conection.execute(`INSERT INTO permission (permiss, module, rol ) VALUES (?,?,?)`,[permiss, modules, rol]);
        if(save){
            res.status(httpStatus.CREATED).json({
                message: 'Registro creado',
                module: Module
            })
        }
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error interno en el servidor: ${error}`,
            module: Module,
        });
    }
}

module.exports = {
    getPermissRol,
    savePermission
}