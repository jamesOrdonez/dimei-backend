const conection = require("../db/conection");
const httpStatus = require("http-status");
const Module = "product"

async function getproduct(req, res) {
    try {
        const product = await conection.execute("SELECT * FROM product ORDER BY 1 DESC");
        if (product) {
            res.status(httpStatus.OK).json({
                data: product[0],
                module: Module
            });
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

async function getOneProduct(req, res) {
    try {
        const id = req.params.id;
        const data = conection.execute(`SELECT * FROM product WHERE id = ?`, [id]);
        if (data) {
            res.status(httpStatus.OK).json({
                data: data,
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
}

async function saveproduct (req, res){
    try {
        const { name, description } = req.body;
        const saveproduct = await conection.execute(`INSERT INTO product (name, description) VALUE (?,?)`,[name, description]);
        if(saveproduct){
            res.status(httpStatus.CREATED).json({
                message: "Registro creado",
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
}

async function updateProduct(req, res) {
    try {
        const { name, description } = req.body;
        const id = req.params.id;

        const update = await conection.execute(`UPDATE product SET name=?, description=? where id=?`, [name, description, id]);
        if (update) {
            res.status(httpStatus.OK).json({
                message: "Registro actualizado",
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

async function deleteProduct(req, res) {
    try {
        const id = req.params.id;2

        const itemProductDelete = await conection.execute(`DELETE FROM item_product WHERE product = ?`, [id]);
        if (itemProductDelete) {

            const deleteProduct = await conection.execute(`DELETE FROM product WHERE id = ?`[id]);
            if (deleteProduct) {
                res.status(httpStatus.OK).json({
                    message: "Registro eliminado",
                    module: Module
                })
            }
        }
    } catch (error) {
        console.error(error);
        res.status
            (httpStatus.INTERNAL_SERVER_ERROR).json({
                message: `Error interno en el servidor: ${error}`,
                module: Module
            })
    }
}

module.exports = {
    getproduct,
    getOneProduct,
    saveproduct,
    updateProduct,
    deleteProduct
}