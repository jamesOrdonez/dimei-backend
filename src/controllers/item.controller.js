const conection = require("../db/conection");
const httpStatus = require("http-status");
const Module = 'item'

async function saveItems(req, res) {
    try {
        const { description, amount, group_item, position, price, state } = req.body;

        const data = await conection.execute(`INSERT INTO item (description, amount, group_item, position, price, state) VALUE (?,?,?,?,?,?)`, [description, amount, group_item, position, price, state]);
        if (data) {
            res.status(httpStatus.CREATED).json({
                message: "Registro creado",
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

async function getItems(req, res) {
    try {
        const data = await conection.execute('SELECT * FROM item ORDER BY 1 DESC');
        if (data) {
            res.status(httpStatus.OK).json({
                data: data[0],
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

async function getOneItem(req, res) {
    try {
        const description = req.body.description;
        const item = await conection.execute(`SELECT * FROM item WHERE description LIKE ?`, [`%${description}%`]);
        console.log(item);
        if (item[0].length > 0) {
            res.status(httpStatus.OK).json({
                data: item[0],
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
        });
    }
}

async function updateItem(req, res) {
    try {
        const { description, amount, group_item, position, price, state } = req.body;
        const id = req.params.id;
        const update = conection.execute(`UPDATE item SET description=?, amount=?, group_item=?, position=?, price=?, state=? WHERE id=${id}`, [description, amount, group_item, position, price, state]);

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
        });
    }
}

async function updateItem(req, res) {
    try {
        const { description, amount, group_item, position, price, state } = req.body;
        const id = req.params.id;
        const update = conection.execute(`UPDATE item SET description=?, amount=?, group_item=?, position=?, price=?, state=? WHERE id=${id}`, [description, amount, group_item, position, price, state]);

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
        });
    }
}

async function deleteItem(req, res){
    try {
        const id = req.params.id;

        const deleteItem = await conection.execute(`DELETE FROM item WHERE id = ?`, [id]);
        if(deleteItem){
            res.status(httpStatus.OK).json({
                message: 'Registro eliminado'
            })
        }
    } catch (error) {
        console.log(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error interno en el servidor: ${error}`,
            module: Module
        });
    }
}


module.exports = {
    saveItems,
    getItems,
    getOneItem,
    updateItem,
    deleteItem
}