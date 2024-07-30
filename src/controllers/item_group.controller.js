const conection = require("../db/conection");
const httpStatus = require("http-status");
const Module = "item_group";

async function saveItem(req, res) {
    try {
        const { name, state, company } = req.body;

        const item_group = await conection.execute(`INSERT INTO item_group (name, state, company) VALUE (?, ?)`, [name, state, company]);
        if (item_group) {
            res.status(httpStatus.CREATED).json({
                message: "Registro guardado",
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

async function getItemGroup(req, res) {
    try {
        const id = req.params.id;
        const query = await conection.execute(`SELECT * FROM item_group WHERE company = ? ORDER BY 1 DESC`,[id]);
        if (query) {
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

async function getOneItemGroup(req, res) {
    try {
        const id = req.params.id;
        const itemGroup = await conection.execute(`SELECT * FROM item_group WHERE id = ?`, [id]);
        if (itemGroup.length > 0) {
            res.status(httpStatus.OK).json({
                data: itemGroup,
                module: Module
            });
        } else {
            res.status(httpStatus.NOT_FOUND).json({
                message: 'Item not found',
                module: Module
            });
        }
    } catch (error) {
        console.log(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error interno en el servidor: ${error}`,
            module: Module
        })
    }
}

async function updateItemGroup(req, res) {
    try {
        const { name, state } = req.body;
        const id = req.params.id;

        const update = conection.execute(`UPDATE item_group SET name=?, state=? WHERE id=?`, [name, state, id]);
        if (update) {
            res.status(httpStatus.OK).json({
                message: 'registro actualizado',
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

async function deleteItemGroup(req, res) {
    try {
        const id = req.params.id;

        const deleteItem = conection.execute(`DELETE FROM item_group WHERE id=?`, [id]);

        if (deleteItem) {
            res.status(httpStatus.OK).json({
                message: 'Registro eliminado.',
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
    getItemGroup,
    getOneItemGroup,
    updateItemGroup,
    deleteItemGroup
}