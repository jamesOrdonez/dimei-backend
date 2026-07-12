const httpStatus = require("http-status");
const sequelize = require("../db/conection");
const ToolLoan = require("../models/ToolLoan");
const ToolLoanItem = require("../models/ToolLoanItem");
const ToolLoanStatusHistory = require("../models/ToolLoanStatusHistory");
const Tool = require("../models/Tool");
const User = require("../models/user");
const ToolGroup = require("../models/ToolGroup");

const Module = "tool_loan";

// Crear préstamo
async function saveLoan(req, res) {
    const t = await sequelize.transaction();
    try {
        const { borrower_user_id, observations, net_tools, company, fkUser } = req.body;

        if (!borrower_user_id) {
            await t.rollback();
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "Debe seleccionar un usuario para el préstamo.",
                module: Module
            });
        }

        if (!net_tools || !Array.isArray(net_tools) || net_tools.length === 0) {
            await t.rollback();
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "Debe seleccionar al menos una herramienta para el préstamo.",
                module: Module
            });
        }

        const loan = await ToolLoan.create({
            borrower_user_id,
            created_by: fkUser,
            observations: observations || null,
            status: 'Prestado',
            company,
            date: new Date(),
        }, { transaction: t });

        for (const toolReq of net_tools) {
            const toolDb = await Tool.findByPk(toolReq.id, { transaction: t });
            if (!toolDb) {
                await t.rollback();
                return res.status(httpStatus.NOT_FOUND).json({
                    message: `Herramienta con ID ${toolReq.id} no encontrada.`,
                    module: Module
                });
            }

            // Calcular cantidad actualmente prestada
            // Sumamos (quantity - returned_quantity) de todos los items en préstamos activos
            const activeLoanItems = await ToolLoanItem.findAll({
                where: { tool_id: toolReq.id },
                include: [{
                    model: ToolLoan,
                    as: 'toolLoan',
                    where: { status: 'Prestado' }
                }],
                transaction: t
            });

            let currentlyLent = 0;
            activeLoanItems.forEach(item => {
                currentlyLent += (item.quantity - (item.returned_quantity || 0));
            });

            const available = (toolDb.amount || 0) - currentlyLent;
            const requestedQty = toolReq.quantity || 1;

            if (requestedQty > available) {
                await t.rollback();
                return res.status(httpStatus.BAD_REQUEST).json({
                    message: `No hay suficiente stock para "${toolDb.description}". Disponible: ${available}, Solicitado: ${requestedQty}`,
                    module: Module
                });
            }

            await ToolLoanItem.create({
                tool_loan_id: loan.id,
                tool_id: toolReq.id,
                quantity: requestedQty,
            }, { transaction: t });
        }

        // Registrar en historial el estado inicial
        await ToolLoanStatusHistory.create({
            tool_loan_id: loan.id,
            status: 'Prestado',
            observations: observations || 'Préstamo inicial',
            changed_by: fkUser,
            date: new Date(),
        }, { transaction: t });

        await t.commit();

        return res.status(httpStatus.CREATED).json({
            message: "Préstamo registrado correctamente",
            loanId: loan.id,
            module: Module
        });
    } catch (error) {
        await t.rollback();
        console.error("Error al registrar préstamo:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Error interno en el servidor",
            error: error.message,
            module: Module
        });
    }
}

// Obtener todos los préstamos de una compañía
async function getLoans(req, res) {
    try {
        const { company } = req.params;
        const loans = await ToolLoan.findAll({
            where: { company },
            order: [['date', 'DESC']],
            include: [
                { model: User, as: 'BorrowerUser', attributes: ['id', 'name'] },
                { model: User, as: 'CreatedBy', attributes: ['id', 'name'] },
                {
                    model: ToolLoanItem,
                    as: 'loanItems',
                    include: [{
                        model: Tool,
                        as: 'tool',
                        attributes: ['id', 'description'],
                        include: [{ model: ToolGroup, as: 'ToolGroup', attributes: ['id', 'name'] }]
                    }]
                },
                {
                    model: ToolLoanStatusHistory,
                    as: 'statusHistory',
                    // Solo las entradas de devolución individual (tienen tool_id y qty)
                    where: { tool_id: { [require('sequelize').Op.ne]: null } },
                    required: false,
                    include: [{ model: User, as: 'ChangedBy', attributes: ['id', 'name'] }]
                }
            ]
        });

        return res.status(httpStatus.OK).json({ data: loans, module: Module });
    } catch (error) {
        console.error("Error al obtener préstamos:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Error interno en el servidor",
            error: error.message,
            module: Module
        });
    }
}

// Registrar devolución parcial o total de herramientas
async function changeStatus(req, res) {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { observations, fkUser, returnedItems } = req.body;

        // Validar que venga al menos un ítem
        if (!Array.isArray(returnedItems) || returnedItems.length === 0) {
            await t.rollback();
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "Debe seleccionar al menos una herramienta para registrar la devolución.",
                module: Module
            });
        }

        const validStatuses = ['Devuelto', 'Devuelto Dañado', 'Perdido'];

        // Validar los estados recibidos
        for (const item of returnedItems) {
            if (!validStatuses.includes(item.status)) {
                await t.rollback();
                return res.status(httpStatus.BAD_REQUEST).json({
                    message: `Estado inválido "${item.status}". Los estados permitidos son: ${validStatuses.join(', ')}`,
                    module: Module
                });
            }
        }

        const loan = await ToolLoan.findByPk(id, { transaction: t });
        if (!loan) {
            await t.rollback();
            return res.status(httpStatus.NOT_FOUND).json({ message: "Préstamo no encontrado", module: Module });
        }

        // Actualizar cada ítem devuelto
        for (const item of returnedItems) {
            const loanItem = await ToolLoanItem.findOne({
                where: { id: item.loanItemId, tool_loan_id: id },
                transaction: t,
            });

            if (!loanItem) continue;

            const newReturnedQty = Math.min(
                (loanItem.returned_quantity || 0) + Number(item.returnQty),
                loanItem.quantity
            );

            // Estado del ítem: si la cantidad devuelta cubre el total, se cierra; si no, sigue 'Prestado'
            const itemFullyReturned = newReturnedQty >= loanItem.quantity;
            const itemStatus = itemFullyReturned ? item.status : 'Prestado';

            await loanItem.update({
                returned_quantity: newReturnedQty,
                status: itemStatus,
            }, { transaction: t });

            if (item.status === 'Perdido') {
                const toolDb = await Tool.findByPk(loanItem.tool_id, { transaction: t });
                if (toolDb) {
                    const newAmount = Math.max(0, (toolDb.amount || 0) - Number(item.returnQty));
                    await toolDb.update({ amount: newAmount }, { transaction: t });
                }
            }

            // Registrar en historial: SIEMPRE el status real de la devolución
            await ToolLoanStatusHistory.create({
                tool_loan_id: id,
                tool_id: loanItem.tool_id,
                qty: Number(item.returnQty),
                status: item.status,   // status real ('Devuelto', 'Devuelto Dañado', 'Perdido')
                observations: observations
                    ? `[Herramienta #${loanItem.tool_id}] ${observations}`
                    : `Devolución de herramienta #${loanItem.tool_id} (cant: ${item.returnQty})`,
                changed_by: fkUser,
                date: new Date(),
            }, { transaction: t });
        }

        // Recalcular el estado global del préstamo
        const allItems = await ToolLoanItem.findAll({
            where: { tool_loan_id: id },
            transaction: t,
        });

        const allReturned = allItems.every(i => i.returned_quantity >= i.quantity);
        const anyPrestado = allItems.some(i => i.status === 'Prestado');
        const anyPerdido = allItems.some(i => i.status === 'Perdido');
        const anyDanado = allItems.some(i => i.status === 'Devuelto Dañado');

        let globalStatus = 'Prestado';
        if (allReturned) {
            if (anyPerdido) globalStatus = 'Perdido';
            else if (anyDanado) globalStatus = 'Devuelto Dañado';
            else globalStatus = 'Devuelto';
        } else if (!anyPrestado && (anyPerdido || anyDanado)) {
            // Todos procesados pero mezcla de estados (algunos devueltos, otros perdidos/dañados)
            globalStatus = anyPerdido ? 'Perdido' : 'Devuelto Dañado';
        }

        await loan.update({ status: globalStatus }, { transaction: t });

        await t.commit();

        return res.status(httpStatus.OK).json({
            message: "Devolución registrada correctamente",
            globalStatus,
            module: Module
        });
    } catch (error) {
        await t.rollback();
        console.error("Error al registrar devolución:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Error interno en el servidor",
            error: error.message,
            module: Module
        });
    }
}

// Obtener historial de estados de un préstamo
async function getStatusHistory(req, res) {
    try {
        const { id } = req.params;
        const history = await ToolLoanStatusHistory.findAll({
            where: { tool_loan_id: id },
            order: [['date', 'ASC']],
            include: [
                { model: User, as: 'ChangedBy', attributes: ['id', 'name'] }
            ]
        });

        return res.status(httpStatus.OK).json({ data: history, module: Module });
    } catch (error) {
        console.error("Error al obtener historial:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Error interno en el servidor",
            error: error.message,
            module: Module
        });
    }
}

module.exports = { saveLoan, getLoans, changeStatus, getStatusHistory };
