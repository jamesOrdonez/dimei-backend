const httpStatus = require('http-status');
const conection = require('../db/conection');
const Module = 'permission';

async function getPermissRol(req,res){
    try {
        const id = req.params.id;
        const permiss = await conection.execute(`select p.id,u.name as userName,r.name,m.module,p.permiss from user u join rol r on u.rol = r.id join permission p on p.rol = r.id join module m on m.id = p.module join company c on c.id = u.company where p.company = ? order by p.id desc`, [id]);

        if(permiss){
            res.status(httpStatus.OK).json({
                data: permiss[0],
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
        const { permiss, modules, rol, company } = req.body;
        const save = await conection.execute(`INSERT INTO permission (permiss, module, rol ) VALUES (?,?,?,?)`,[permiss, modules, rol, company]);
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
};

async function updatePermission(req, res){
    try {
        const { permiss, modules, rol } = req.body;
        const id = req.params.id;

        const updatePermiss = await conection.execute(`UPDATE permission SET permiss=?, module=?, rol=? WHERE id = ?`,[permiss, modules, rol, id]);

        if(updatePermiss){
            res.status(httpStatus.OK).json({
                message: 'Registro actualizado',
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
};

async function deletePermission(req, res){
    try {
        const id = req.params.id;

        const deletePermiss = await conection.execute(`DELETE FROM permission WHERE id = ?`,[id]);

        if(deletePermiss){
            res.status(httpStatus.OK).json({
                message:" Registro eliminado",
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
    savePermission,
    updatePermission,
    deletePermission
}