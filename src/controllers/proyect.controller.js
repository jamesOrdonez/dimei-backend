const httpStatus = require('http-status');
const conection = require("../db/conection");
const Module = 'proyect';

async function saveProyect(req, res) {
    try {
        const { name, contact, cellphone, email, address, city, date, equipmentType, stops, ability, path, user, company } = req.body;

        const save = await conection.execute(`INSERT INTO ${Module} (name, contact, cellphone, email, address, city, date, equipmentType, stops, ability, path, user, company) VALUE (?,?,?,?,?,?,?,?,?,?,?,?,?)`, [name, contact, cellphone, email, address, city, date, equipmentType, stops, ability, path, user, company]);

        if (save) {
            res.status(httpStatus.OK).json({
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

async function getProyects(req, res) {
    try {
        const id = req.params.id;
        const proyects = await conection.execute(`	
            SELECT 
                p.id,
                p.name AS proyect,
                contact,
                cellphone,
                email,
                address,
                city,
                date,
                p.equipmentType,
                stops,
                ability,
                path,
                u.name AS user,
                c.name AS company
            FROM
                proyect p
                    JOIN
                equipmenttype eq ON eq.id = p.equipmentType
                    JOIN
                user u ON u.id = p.user
                    JOIN
                company c ON p.company = c.id
                    WHERE 
                c.id = ?`, [id]);

    if(proyects){
        res.status(httpStatus.OK).json({
            data: proyects[0],
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

async function updateProyect(rew, res){
    try {
        const { name, contact, cellphone, email, address, city, date, equipmentType, stops, ability, path } = req.body;
        const id = req.params.id;

        const update = await conection.execute(`UPDATE ${Module} SET name=?, contact=?, cellphone=?, email=?, address=?, city=?, date=?, equipmentType=?, stops=?, ability=?, path=? WHERE id = ?`, [name, contact, cellphone, email, address, city, date, equipmentType, stops, ability, path, id]);

        if(update){
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

async function deleteProyect(req, res){
    try {
        const id = req.params.id;

        const deleteProyect = await conection.execute(`DELETE FROM ${Module} WHERE id = ?`,[id]);
        if(deleteProyect){
            res.status(httpStatus.OK).json({
                message: 'Registro eliminado',
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
    saveProyect,
    getProyects,
    updateProyect,
    deleteProyect
}