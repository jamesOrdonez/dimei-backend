const httpStatus = require("http-status");
const sequelize = require("../db/conection");

const Remision = require("../models/remision");
const Item = require("../models/item");
const RemisionItem = require("../models/remision_item");

const Module = "remision";

async function save(req, res) {
    const t = await sequelize.transaction();

    try {
        const { description, net_items, company, fkUser } = req.body;

        let erroresStock = [];

        for (const item of net_items) {
            const { id, quantity } = item;

            const dbItem = await Item.findOne({
                where: { id },
                transaction: t,
                lock: true,
            });

            if (!dbItem) {
                erroresStock.push({
                    id,
                    description: `ID ${id}`,
                    solicitado: Number(quantity),
                    disponible: 0,
                    message: `El item con id ${id} no existe`,
                });
                continue;
            }

            const cantidadDisponible = Number(dbItem.amount);
            const nombreItem = dbItem.description || `ID ${id}`;
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
            await t.rollback();
            return res.status(400).json({
                message: "Algunos items no tienen stock suficiente",
                errors: erroresStock,
            });
        }

        const remision = await Remision.create(
            {
                description,
                fkUser,
                company,
            },
            { transaction: t }
        );

        for (const item of net_items) {
            const { id, quantity } = item;

            await RemisionItem.create(
                {
                    fk_item: id,
                    quantity,
                    fk_remision: remision.id,
                    fkUser,
                },
                { transaction: t }
            );

            await Item.update(
                { amount: sequelize.literal(`amount - ${quantity}`) },
                {
                    where: { id },
                    transaction: t,
                }
            );
        }

        await t.commit();

        return res.status(httpStatus.OK).json({
            message: "Remisión guardada correctamente",
            remisionId: remision.id,
        });

    } catch (error) {
        await t.rollback();

        console.error("Error interno en el servidor:", error);

        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Error interno en el servidor",
            error: error.message,
        });
    }
}

module.exports = {
    save,
};