const conection = require("../db/conection");
const httpStatus = require("http-status");
const Module = 'item'

async function saveItems(req, res) {
    try {
        const { description, amount, group_item, position, price, variable, value1, mathOperation, value2, unitOfmeasure, user, company } = req.body;

        const data = await conection.execute(`INSERT INTO item (description, amount, group_item, position, price, variable, value1, mathOperation, value2, unitOfmeasure, user, company ) VALUE (?,?,?,?,?,?,?,?,?,?,?)`, [description, amount, group_item, position, price, variable, value1, mathOperation, value2, unitOfmeasure, user, company]);
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
        const id = req.params.id;
        const data = await conection.execute(`SELECT * FROM item WHERE company = ? ORDER BY 1 DESC`,[id]);
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
        const id = req.params.id;
        const item = await conection.execute(`SELECT * FROM item WHERE id = ?`, [id]);
        if (item.length > 0) {
            res.status(httpStatus.OK).json({
                data: item,
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
        const { description, amount, group_item, position, price, variable, value1, mathOperation, value2, unitOfmeasure } = req.body;
        const id = req.params.id;
        const update = conection.execute(`UPDATE item SET description=?, amount=?, group_item=?, position=?, price=?, variable=?, value1=?, mathOperation=?, value2=?, unitOfmeasure=? WHERE id=${id}`, [description, amount, group_item, position, price, variable, value1, mathOperation, value2, unitOfmeasure, id]);

        if (update) {
            res.status(httpStatus.OK).json({
                message: 'Registro actualizado',
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