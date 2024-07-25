const conection = require("../db/conection");
const httpStatus = require("http-status");
const Module = "item_group";

async function saveItem(req, res) {
    try {
        const { name, state } = req.body;

        const item_group = await conection.execute(`INSERT INTO item_group (name, state) VALUE (?, ?)`, [name, state]);
        if(item_group){
            res.status(httpStatus.CREATED).json({
                message:"Registro guardado",
                module: Module
            })
        }
    } catch (error) {
        console.error(error);
        res.status
        (httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error interno en el servidor: ${error}`,
            module: Module
        })
    }
};

async function getItemGroup(req, res){
    try {
        const query = await conection.execute('SELECT * FROM item_group ORDER BY 1 DESC');
        if(query){
            res.status(httpStatus.OK).json({
                data: query[0],
                module: Module
            })
        }
    } catch (error) {
        console.log(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error interno en el servidor: ${error}`,
            module: Module
        })
    }
}

module.exports = {
    saveItem,
    getItemGroup
}