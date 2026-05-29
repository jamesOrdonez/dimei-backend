const httpStatus = require("http-status");
const sequelize = require("../db/conection");

const Remision = require("../models/remision");
const Item = require("../models/item");
const RemisionItem = require("../models/remision_item");
const Proyect = require("../models/proyect");
const Product = require("../models/product");
const ItemProduct = require("../models/item_product");
const RemisionProduct = require("../models/remision_product");
const User = require("../models/user");

const Module = "remision";

async function save(req, res) {
    const t = await sequelize.transaction();

    try {
        let { description, company, fkUser, fk_proyect, net_products, net_items } = req.body;

        // 1. Agrupar duplicados y normalizar entrada
        const normalizedProducts = [];
        if (net_products && Array.isArray(net_products)) {
            const aggregated = net_products.reduce((acc, p) => {
                const id = Number(p.id);
                if (!acc[id]) acc[id] = 0;
                acc[id] += Number(p.quantity || 0);
                return acc;
            }, {});
            Object.entries(aggregated).forEach(([id, quantity]) => normalizedProducts.push({ id: Number(id), quantity }));
        }

        const normalizedItems = [];
        if (net_items && Array.isArray(net_items)) {
            const aggregated = net_items.reduce((acc, i) => {
                const id = Number(i.id);
                if (!acc[id]) acc[id] = 0;
                acc[id] += Number(i.quantity || 0);
                return acc;
            }, {});
            Object.entries(aggregated).forEach(([id, quantity]) => normalizedItems.push({ id: Number(id), quantity }));
        }

        // 1b. Validar que no esté vacía
        if (normalizedProducts.length === 0 && normalizedItems.length === 0) {
            await t.rollback();
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "No se puede guardar una remisión vacía. Debe seleccionar al menos un producto o ítem.",
                module: Module
            });
        }

        // 2. Obtener datos del proyecto para productos variables
        const project = await Proyect.findByPk(fk_proyect, { transaction: t });
        const travel = Number(project?.travel || 0);

        // 3. VALIDACIÓN PREVIA DE STOCK
        const requiredStock = {}; // { itemId: quantity }
        const itemNames = {};

        // 3a. Calcular requerimientos de productos
        for (const prod of normalizedProducts) {
            const productData = await Product.findByPk(prod.id, {
                include: [{ model: ItemProduct, as: 'productItem' }],
                transaction: t
            });
            if (!productData) continue;

            for (const pi of (productData.productItem || [])) {
                let itemQtyNeeded = 0;
                if (pi.variable) {
                    const v1 = Number(pi.value1 || 0);
                    const v2 = Number(pi.value2 || 0);
                    itemQtyNeeded = (travel * v1) + v2;
                } else {
                    itemQtyNeeded = Number(pi.quantity || 0);
                }
                const qty = itemQtyNeeded * Number(prod.quantity);
                requiredStock[pi.item] = (requiredStock[pi.item] || 0) + qty;
            }
        }

        // 3b. Calcular requerimientos de ítems directos
        for (const it of normalizedItems) {
            requiredStock[it.id] = (requiredStock[it.id] || 0) + Number(it.quantity);
        }

        // 3c. Verificar disponibilidad real
        const missingItems = [];
        for (const [itemId, needed] of Object.entries(requiredStock)) {
            const item = await Item.findByPk(itemId, { transaction: t, lock: true });
            const amountNeeded = Number(needed);
            if (!item || Number(item.amount) < amountNeeded) {
                const name = item?.description || `Ítem #${itemId}`;
                const available = Number(item?.amount || 0);
                missingItems.push(`${name} (Disponible: ${available.toFixed(2)}, Requerido: ${amountNeeded.toFixed(2)})`);
            }
            if (item) itemNames[itemId] = item.description;
        }

        if (missingItems.length > 0) {
            await t.rollback();
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "No se puede realizar la remisión por falta de stock suficiente en los siguientes ítems:\n- " + missingItems.join("\n- "),
                module: Module
            });
        }

        // 4. PERSISTENCIA (Solo si hay stock suficiente para todo)
        const remision = await Remision.create({
            description,
            fkUser,
            company,
            date: new Date(),
            fk_proyect: fk_proyect || null
        }, { transaction: t });

        // 4a. Procesar y descontar productos
        for (const prod of normalizedProducts) {
            const productData = await Product.findByPk(prod.id, {
                include: [{ model: ItemProduct, as: 'productItem' }],
                transaction: t
            });

            const remProduct = await RemisionProduct.create({
                fk_remision: remision.id,
                fk_product: prod.id,
                quantity: prod.quantity,
                status: 'Completo'
            }, { transaction: t });

            for (const pi of (productData.productItem || [])) {
                let itemQtyNeeded = 0;
                if (pi.variable) {
                    const v1 = Number(pi.value1 || 0);
                    const v2 = Number(pi.value2 || 0);
                    itemQtyNeeded = (travel * v1) + v2;
                } else {
                    itemQtyNeeded = Number(pi.quantity || 0);
                }
                const discount = itemQtyNeeded * Number(prod.quantity);
                const item = await Item.findByPk(pi.item, { transaction: t });
                await item.update({ amount: item.amount - discount }, { transaction: t });

                await RemisionItem.create({
                    fk_item: pi.item,
                    quantity: discount,
                    fk_remision: remision.id,
                    fkUser,
                    fk_remision_product: remProduct.id,
                    status: 'Completo'
                }, { transaction: t });
            }
        }

        // 4b. Procesar y descontar ítems directos
        for (const it of normalizedItems) {
            const item = await Item.findByPk(it.id, { transaction: t });
            await item.update({ amount: item.amount - Number(it.quantity) }, { transaction: t });

            await RemisionItem.create({
                fk_item: it.id,
                quantity: it.quantity,
                fk_remision: remision.id,
                fkUser,
                status: 'Completo'
            }, { transaction: t });
        }

        await t.commit();

        return res.status(httpStatus.OK).json({
            message: "Remisión procesada correctamente",
            remisionId: remision.id
        });

    } catch (error) {
        await t.rollback();
        console.error("Error procesando remisión:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Error interno en el servidor",
            error: error.message,
            module: Module,
        });
    }
}

async function complete(req, res) {
    const t = await sequelize.transaction();
    try {
        const { productFks, itemFks, fk_proyect } = req.body;

        // 1. Obtener datos del proyecto para variables de cálculo
        const project = await Proyect.findByPk(fk_proyect, { transaction: t });
        if (!project) {
            await t.rollback();
            return res.status(httpStatus.NOT_FOUND).json({ message: "Proyecto no encontrado" });
        }
        const travel = Number(project.travel || 0);

        const errors = [];
        const successProducts = [];
        const successItems = [];
        const stockTracker = {};
        const descriptionCache = {};

        // 2. Procesar Productos Agrupados
        if (productFks && Array.isArray(productFks)) {
            for (const productId of productFks) {
                // Buscar todos los registros de remision_product pendientes de este producto en el proyecto
                const remProducts = await RemisionProduct.findAll({
                    include: [
                        { model: Product, as: 'product', include: [{ model: ItemProduct, as: 'productItem' }] },
                        { model: Remision, as: 'remision', where: { fk_proyect } }
                    ],
                    where: { fk_product: productId, status: 'Pendiente' },
                    transaction: t, lock: true
                });

                if (remProducts.length === 0) continue;

                // Todos los registros de este producto comparten la misma estructura
                const productData = remProducts[0].product;

                // Cálculo total de stock necesario para TODOS los registros pendientes de este producto
                const totalQuantity = remProducts.reduce((sum, rp) => sum + Number(rp.quantity), 0);
                
                let canComplete = true;
                const itemsToDeduct = [];
                const localMissing = [];

                for (const pi of (productData.productItem || [])) {
                    let itemQtyNeeded = 0;
                    if (pi.variable) {
                        const v1 = Number(pi.value1 || 0);
                        const v2 = Number(pi.value2 || 0);
                        itemQtyNeeded = (travel * v1) + v2;
                    } else {
                        itemQtyNeeded = Number(pi.quantity || 0);
                    }
                    const needed = itemQtyNeeded * totalQuantity;
                    
                    if (!(pi.item in stockTracker)) {
                        const item = await Item.findByPk(pi.item, { transaction: t, lock: true });
                        stockTracker[pi.item] = Number(item?.amount || 0);
                        descriptionCache[pi.item] = item?.description || 'Desconocido';
                    }

                    if (stockTracker[pi.item] < needed) {
                        canComplete = false;
                        localMissing.push(`${descriptionCache[pi.item]} (Falta: ${(needed - stockTracker[pi.item]).toFixed(2)})`);
                    }
                    itemsToDeduct.push({ id: pi.item, quantity: needed });
                }

                if (canComplete) {
                    for (const itD of itemsToDeduct) {
                        stockTracker[itD.id] -= itD.quantity;
                        await Item.setAmount(itD.id, stockTracker[itD.id], t);
                    }
                    // Actualizar todos los rem_products y sus rem_items
                    for (const rp of remProducts) {
                        await rp.update({ status: 'Completo' }, { transaction: t });
                        await RemisionItem.update({ status: 'Completo' }, {
                            where: { fk_remision_product: rp.id },
                            transaction: t
                        });
                    }
                    successProducts.push(productData.name);
                } else {
                    errors.push({ name: productData.name, type: 'Producto', missing: localMissing });
                }
            }
        }

        // 3. Procesar Ítems Directos Agrupados
        if (itemFks && Array.isArray(itemFks)) {
            for (const itemId of itemFks) {
                // Buscar todos los registros de remision_item pendientes de este item en el proyecto
                const remItems = await RemisionItem.findAll({
                    include: [{ model: Remision, as: 'remision', where: { fk_proyect } }],
                    where: { fk_item: itemId, status: 'Pendiente', fk_remision_product: null },
                    transaction: t, lock: true
                });

                if (remItems.length === 0) continue;

                if (!(itemId in stockTracker)) {
                    const item = await Item.findByPk(itemId, { transaction: t, lock: true });
                    stockTracker[itemId] = Number(item?.amount || 0);
                    descriptionCache[itemId] = item?.description || 'Ítem';
                }

                const totalNeeded = remItems.reduce((sum, ri) => sum + Number(ri.quantity), 0);
                const isItemPending = stockTracker[itemId] < totalNeeded;

                if (!isItemPending) {
                    stockTracker[itemId] -= totalNeeded;
                    await Item.setAmount(itemId, stockTracker[itemId], t);
                    for (const ri of remItems) {
                        await ri.update({ status: 'Completo' }, { transaction: t });
                    }
                    successItems.push(descriptionCache[itemId]);
                } else {
                    errors.push({
                        name: descriptionCache[itemId],
                        type: 'Ítem',
                        missing: [`Falta: ${(totalNeeded - stockTracker[itemId]).toFixed(2)}`]
                    });
                }
            }
        }

        if (errors.length > 0 && successProducts.length === 0 && successItems.length === 0) {
            await t.rollback();
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "No se pudo completar la acción porque falta stock.",
                errors
            });
        }

        await t.commit();
        return res.status(httpStatus.OK).json({
            message: "Proceso completado.",
            successProducts,
            successItems,
            errors
        });

    } catch (error) {
        if (t) await t.rollback();
        console.error("Error al completar remisión:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Error interno al procesar la solicitud.",
            error: error.message
        });
    }
}

// Helper para actualizar stock de forma segura
Item.setAmount = async (id, amount, transaction) => {
    return await Item.update({ amount }, { where: { id }, transaction });
};

async function getAll(req, res) {
    try {
        const { company } = req.params;
        const whereClause = {};
        if (company) {
            whereClause.company = company;
        }

        const remisiones = await Remision.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'user']
                },
                {
                    model: Proyect,
                    as: 'proyect',
                    include: [
                        {
                            model: require("../models/clients"),
                            as: 'customerData'
                        }
                    ]
                },
                {
                    model: RemisionProduct,
                    as: 'remisionProducts',
                    include: [
                        {
                            model: Product,
                            as: 'product',
                            attributes: ['id', 'name']
                        }
                    ]
                },
                {
                    model: RemisionItem,
                    as: 'remisionItems',
                    include: [
                        {
                            model: Item,
                            as: 'item',
                            attributes: ['id', 'description']
                        }
                    ]
                }
            ],
            order: [['date', 'DESC']]
        });

        const formattedRemisiones = remisiones.map(r => ({
            id: r.id,
            date: r.date,
            project: r.proyect?.id ? `Proyecto #${r.proyect.id}` : 'S/N',
            customer: r.proyect?.customerData?.nombre || 'S/N',
            description: r.description || 'Sin descripción',
            elaboradoPor: r.user?.name || 'Sistema',
            remisionProducts: r.remisionProducts,
            remisionItems: r.remisionItems,
            proyect: r.proyect // Keep original proyect reference just in case
        }));

        return res.status(httpStatus.OK).json({
            data: formattedRemisiones,
            module: Module
        });
    } catch (error) {
        console.error("Error al obtener remisiones:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Error interno al procesar la solicitud.",
            error: error.message
        });
    }
}

module.exports = {
    save,
    complete,
    getAll
};