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
        const stockTracker = {};
        const descriptionCache = {};
        const pendingItemsList = []; // List of products/items that were marked as 'Pendiente'

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

                    // Lógica: (recorrido * v1) [op] v2
                    let base = travel * v1;
                    if (op === '*') calculationUnits = base * v2;
                    else if (op === '/') calculationUnits = v2 !== 0 ? base / v2 : base;
                    else if (op === '+') calculationUnits = base + v2;
                    else if (op === '-') calculationUnits = base - v2;
                    else calculationUnits = base;
                }

                // Determinar si el producto quedará pendiente por falta de stock
                let isPending = false;
                const itemsToProcess = [];
                const missingForProduct = [];

                for (const pi of (productData.productItem || [])) {
                    const itemDiscount = calculationUnits * Number(pi.quantity || 0) * Number(quantity);
                    
                    if (!(pi.item in stockTracker)) {
                        const item = await Item.findByPk(pi.item, { transaction: t, lock: true });
                        stockTracker[pi.item] = Number(item?.amount || 0);
                        descriptionCache[pi.item] = item?.description || 'Desconocido';
                    }

                    if (stockTracker[pi.item] < itemDiscount) {
                        isPending = true;
                        missingForProduct.push(`${descriptionCache[pi.item]} (Falta: ${(itemDiscount - stockTracker[pi.item]).toFixed(2)})`);
                    }

                    itemsToProcess.push({
                        fk_item: pi.item,
                        quantity: itemDiscount
                    });
                }

                if (isPending) {
                    pendingItemsList.push({ name: productData.name, type: 'Producto', missing: missingForProduct });
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
                    if (!isPending) {
                        stockTracker[itP.fk_item] -= itP.quantity;
                        await Item.setAmount(itP.fk_item, stockTracker[itP.fk_item], t);
                    }

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
                
                if (!(id in stockTracker)) {
                    const item = await Item.findByPk(id, { transaction: t, lock: true });
                    stockTracker[id] = Number(item?.amount || 0);
                    descriptionCache[id] = item?.description || 'Ítem';
                }

                const isItemPending = stockTracker[id] < Number(quantity);

                if (!isItemPending) {
                    stockTracker[id] -= Number(quantity);
                    await Item.setAmount(id, stockTracker[id], t);
                } else {
                    pendingItemsList.push({ 
                        name: descriptionCache[id], 
                        type: 'Ítem', 
                        missing: [`Falta: ${Number(quantity) - stockTracker[id]}`] 
                    });
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
            pending: pendingItemsList // Return the pending list for frontend feedback
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
                let calculationUnits = 1;

                if (productData.variable) {
                    const v1 = Number(productData.value1 || 0);
                    const v2 = Number(productData.value2 || 0);
                    const op = productData.mathOperation;
                    let base = travel * v1;
                    if (op === '*') calculationUnits = base * v2;
                    else if (op === '/') calculationUnits = v2 !== 0 ? base / v2 : base;
                    else if (op === '+') calculationUnits = base + v2;
                    else if (op === '-') calculationUnits = base - v2;
                    else calculationUnits = base;
                }

                // Cálculo total de stock necesario para TODOS los registros pendientes de este producto
                const totalQuantity = remProducts.reduce((sum, rp) => sum + Number(rp.quantity), 0);
                
                let canComplete = true;
                const itemsToDeduct = [];
                const localMissing = [];

                for (const pi of (productData.productItem || [])) {
                    const needed = calculationUnits * Number(pi.quantity || 0) * totalQuantity;
                    
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

module.exports = {
    save,
    complete
};