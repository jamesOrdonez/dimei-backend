const conection = require("../db/conection");
const httpStatus = require("http-status");
const Module = "remision";

async function save(req, res) {
    let connection;

    try {
        const { description, net_items, company, fkUser } = req.body;
        connection = await conection.getConnection();

        await connection.beginTransaction();

        let erroresStock = [];

        for (const item of net_items) {
            const { id, quantity } = item;

            const [rows] = await connection.execute(
                `SELECT amount, description FROM item WHERE id = ? FOR UPDATE`,
                [id]
            );

            if (rows.length === 0) {
                erroresStock.push({
                    id,
                    description: `ID ${id}`,
                    solicitado: Number(quantity),
                    disponible: 0,
                    message: `El item con id ${id} no existe`,
                });
                continue;
            }

            const cantidadDisponible = Number(rows[0].amount)
            const nombreItem = rows[0].description || `ID ${id}`;
            const cantidadSolicitada = Number(quantity);

            if (cantidadSolicitada > cantidadDisponible) {
                erroresStock.push({
                    id,
                    description: nombreItem,
                    solicitado: cantidadSolicitada,
                    disponible: cantidadDisponible,
                    message: `Item "${nombreItem}": solicitados ${cantidadSolicitada}, disponibles ${cantidadDisponible}`,
                });
            }
        }

        if (erroresStock.length > 0) {
            await connection.rollback();

            return res.status(400).json({
                message: "Algunos items no tienen stock suficiente",
                errors: erroresStock,
            });
        }

        const [saveRemision] = await connection.execute(
            `INSERT INTO ${Module} (description, fkUser, company) VALUES (?,?,?)`,
            [description, fkUser, company]
        );

        const remisionId = saveRemision.insertId;

        for (const item of net_items) {
            const { id, quantity } = item;

            await connection.execute(
                `INSERT INTO ${Module}_item (fk_item, quantity, fk_remision, fkUser)
         VALUES (?,?,?,?)`,
                [id, quantity, remisionId, fkUser]
            );

            await connection.execute(
                `UPDATE item SET amount = amount - ? WHERE id = ?`,
                [quantity, id]
            );
        }

        await connection.commit();

        return res.status(200).json({
            message: "Remisión guardada correctamente",
            remisionId,
        });

    } catch (error) {
        if (connection) await connection.rollback();

        console.error("Error interno en el servidor:", error);
        return res.status(500).json({
            message: "Error interno en el servidor",
            error: error.message,
        });

    } finally {
        if (connection) connection.release();
    }
}

module.exports = {
    save,
};