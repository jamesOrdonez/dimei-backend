const httpStatus = require("http-status");
const conection = require("../db/conection");
const Module = 'module';

async function getModule(req, res) {
    try {
        const modules = await conection.execute(`SELECT * FROM module ORDER BY 1 DESC`);
        if (modules) {
            res.status(httpStatus.OK).json({
                data: modules[0],
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

async function saveModule(req, res) {
    try {
        const { modules } = req.body;

        const saveModule = await conection.execute(`INSERT INTO module (module) VALUES (?)`, [modules]);
        if (saveModule) {
            res.status(httpStatus.CREATED).json({
                message: 'Registro guardado',
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

async function updateModule(req, res) {
    try {
        const { modules } = req.body;
        const id = req.params.id;

        const updateModule = await conection.execute(`UPDATE module SET module = ? WHERE id = ?`, [modules, id]);
        
        if(updateModule) {
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

async function deleteModule(req,res){
    try {
        const id = req.params.id;

        const deleteModule = await conection.execute(`DELETE FROM module WHERE id = ?`,[id]);

        if(deleteModule){
            res.status(httpStatus.OK).json({
                message: "registro eliminado",
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
    getModule,
    saveModule,
    updateModule,
    deleteModule
}