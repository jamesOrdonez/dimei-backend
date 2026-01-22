const conection = require("../db/conection");
const httpStatus = require("http-status");
const Module = "remision";

async function save(req, res) {
    try {
        const { description, net_items, company, fkUser } = req.body;

        const [saveRemision] = await conection.execute(
            `INSERT INTO ${Module} (description, fkUser, company) VALUES (?,?,?)`,
            [description, fkUser, company]
        );

        const remisionId = saveRemision.insertId;

        for (const item of net_items) {
            const { id, quantity } = item;

            const itemRemision = await conection.execute(
                `INSERT INTO ${Module}_item (fk_item, quantity,fk_remision, fkUser)
         VALUES (?,?,?,?)`,
                [id, quantity, remisionId, fkUser]
            );

            if (itemRemision) {
                await conection.execute(`
                    UPDATE item SET amount = (amount - ?) WHERE id = ?`,
                    [quantity, id]
                );
            }
        }

        return res.status(200).json({
            message: "Remisión guardada correctamente",
            remisionId,
        });

    } catch (error) {
        console.error("Error interno en el servidor:", error);
        return res.status(500).json({
            message: "Error interno en el servidor",
            error: error.message,
        });
    }
}

module.exports = {
    save,
};