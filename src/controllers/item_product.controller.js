const httpStatus = require('http-status');
const conection = require("../db/conection");
const Module = 'item_product';

// Trae los items de un producto
async function getItemProduct(req, res){
    try {
        const id = req.params.id;
        const itemProduct = await conection.execute(`select p.name, i.description, ip.quantity from product p join item_product ip on ip.product = p.id join item i on i.id = ip.item where p.id =?`,[id]);

        if(itemProduct){
            res.status(httpStatus.OK).json({
                data: itemProduct[0],
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
};

async function saveItemProduct(req,res){
    try {
        const { product, item, quantity } = req.body;

        const save = await conection.execute(`INSERT INTO item_product (product, item, quantity) VALUES (?,?,?)`,[product, item, quantity]);

        if(save){
            res.status(httpStatus.OK).json({
                message: "Registro creado",
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

async function updateItemProduct(req, res){
    try {
        const { product, item, quantity } = req.body;
        const id = req.params.id;

        const update = await conection.execute(`UPDATE item_product SET product = ?, item = ?, quantity = ? WHERE id = ?`,[product, item, quantity, id]);

        if(update){
            res.status(httpStatus.OK).json({
                message: "Registro actualizado",
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
};

async function deleteItemProduct(req, res){
    try {
        const id = req.params.id;

        const deleteItemProduct = await conection.execute(`DELETE FROM item_product WHERE id = ?`,[id]);

        if(deleteItemProduct){
            res.status(httpStatus.OK).json({
                message: "Registro eliminado",
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

module.exports = {
    getItemProduct,
    saveItemProduct,
    updateItemProduct,
    deleteItemProduct
}