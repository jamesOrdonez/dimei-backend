const httpStatus = require("http-status");
const sequelize = require("../db/conection");

const Remision = require("../models/remision");
const Item = require("../models/item");
const RemisionItem = require("../models/remision_item");
const Proyect = require("../models/proyect");
const Product = require("../models/product");
const ItemProduct = require("../models/item_product");
const RemisionProduct = require("../models/remision_product");

const Module = "remision";

async function save(req, res) {
    const t = await sequelize.transaction();

    try {
        let { description, company, fkUser, fk_proyect, net_products, net_items } = req.body;

        // Agrupar productos duplicados por ID sumando sus cantidades
        if (net_products && Array.isArray(net_products)) {
            const aggregated = net_products.reduce((acc, p) => {
                const id = Number(p.id);
                if (!acc[id]) acc[id] = 0;
                acc[id] += Number(p.quantity || 0);
                return acc;
            }, {});
            net_products = Object.entries(aggregated).map(([id, quantity]) => ({ id: Number(id), quantity }));
        }

        // Agrupar ítems duplicados por ID sumando sus cantidades
        if (net_items && Array.isArray(net_items)) {
            const aggregated = net_items.reduce((acc, i) => {
                const id = Number(i.id);
                if (!acc[id]) acc[id] = 0;
                acc[id] += Number(i.quantity || 0);
                return acc;
            }, {});
            net_items = Object.entries(aggregated).map(([id, quantity]) => ({ id: Number(id), quantity }));
        }

        // 1. Obtener datos del proyecto para cálculos de variables
        const project = await Proyect.findByPk(fk_proyect, { transaction: t });
        const travel = Number(project?.travel || 0);

        // 2. Crear la cabecera de la Remisión
        const remisionData = {
            description,
            fkUser,
            company,
            fk_proyect: fk_proyect || null
        };

        const remision = await Remision.create(remisionData, { transaction: t });

        // 3. Procesar Productos
        if (net_products && Array.isArray(net_products)) {
            for (const prod of net_products) {
                const { id, quantity } = prod;
                const productData = await Product.findByPk(id, {
                    include: [{ model: ItemProduct, as: 'productItem' }],
                    transaction: t
                });

                if (!productData) continue;

                let calculationUnits = 1;
                if (productData.variable) {
                    const v1 = Number(productData.value1 || 0);
                    const v2 = Number(productData.value2 || 0);
                    const op = productData.mathOperation;

                    // Lógica: (recorrido * value1) [operación] v2
                    let base = travel * v1;
                    if (op === '*') calculationUnits = base * v2;
                    else if (op === '/') calculationUnits = v2 !== 0 ? base / v2 : base;
                    else if (op === '+') calculationUnits = base + v2;
                    else if (op === '-') calculationUnits = base - v2;
                    else calculationUnits = base;
                }

                // Determinar si el producto quedará pendiente por falta de stock en sus ítems
                let isPending = false;
                const itemsToProcess = [];

                for (const pi of (productData.productItem || [])) {
                    const itemDiscount = calculationUnits * Number(pi.quantity || 0) * Number(quantity);
                    const item = await Item.findByPk(pi.item, { transaction: t, lock: true });

                    if (!item) continue;

                    if (Number(item.amount || 0) < itemDiscount) {
                        isPending = true;
                    }

                    itemsToProcess.push({
                        fk_item: pi.item,
                        quantity: itemDiscount
                    });
                }

                // Crear registro de producto en remisión
                const remProduct = await RemisionProduct.create({
                    fk_remision: remision.id,
                    fk_product: id,
                    quantity,
                    status: isPending ? 'Pendiente' : 'Completo'
                }, { transaction: t });

                // Procesar cada ítem del producto
                for (const itP of itemsToProcess) {
                    // Solo descontar del stock si NO es pendiente
                    if (!isPending) {
                        await Item.update(
                            { amount: sequelize.literal(`amount - ${itP.quantity}`) },
                            { where: { id: itP.fk_item }, transaction: t }
                        );
                    }

                    // Registrar ítem de la remisión
                    await RemisionItem.create({
                        fk_item: itP.fk_item,
                        quantity: itP.quantity,
                        fk_remision: remision.id,
                        fkUser,
                        fk_remision_product: remProduct.id,
                        status: isPending ? 'Pendiente' : 'Completo'
                    }, { transaction: t });
                }
            }
        }

        // 4. Procesar Ítems directos
        if (net_items && Array.isArray(net_items)) {
            for (const it of net_items) {
                const { id, quantity } = it;
                
                const item = await Item.findByPk(id, { transaction: t, lock: true });
                if (!item) continue;

                const isItemPending = Number(item.amount || 0) < Number(quantity);

                if (!isItemPending) {
                    await Item.update(
                        { amount: sequelize.literal(`amount - ${quantity}`) },
                        { where: { id }, transaction: t }
                    );
                }

                await RemisionItem.create({
                    fk_item: id,
                    quantity,
                    fk_remision: remision.id,
                    fkUser,
                    status: isItemPending ? 'Pendiente' : 'Completo'
                }, { transaction: t });
            }
        }

        await t.commit();

        return res.status(httpStatus.OK).json({
            message: "Remisión procesada correctamente",
            remisionId: remision.id,
        });

    } catch (error) {
        await t.rollback();
        console.error("Error procesando remisión:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Error interno en el servidor",
            error: error.message,
        });
    }
}

module.exports = {
    save,
};