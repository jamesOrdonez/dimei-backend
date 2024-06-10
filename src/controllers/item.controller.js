const conection = require("../db/conection");
const httpStatus = require("http-status");
const Module = 'items'

async function saveItems(req,res){
    try {
        const { description, amount, group_item, position, price, state } = req.body;

        const data = await conection.execute(`INSERT INTO item (description, amount, group_item, position, price, state) VALUE (?,?,?,?,?,?)`, [description, amount, group_item, position, price, state]);
        if(data){
            res.status(httpStatus.CREATED).json({
                message: "Registro creado",
                module: Module
            })
        }
    } catch (error) {
        console.error(error);
        res.status
    }
}

module.exports = {
    saveItems   
}