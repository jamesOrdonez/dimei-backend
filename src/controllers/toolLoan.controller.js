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

        for (const tool of net_tools) {
            await ToolLoanItem.create({
                tool_loan_id: loan.id,
                tool_id: tool.id,
                quantity: tool.quantity || 1,
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

// Cambiar estado del préstamo
async function changeStatus(req, res) {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { status, observations, fkUser } = req.body;

        const validStatuses = ['Prestado', 'Devuelto', 'Devuelto Dañado', 'Perdido'];
        if (!validStatuses.includes(status)) {
            await t.rollback();
            return res.status(httpStatus.BAD_REQUEST).json({
                message: `Estado inválido. Los estados permitidos son: ${validStatuses.join(', ')}`,
                module: Module
            });
        }

        const loan = await ToolLoan.findByPk(id, { transaction: t });
        if (!loan) {
            await t.rollback();
            return res.status(httpStatus.NOT_FOUND).json({ message: "Préstamo no encontrado", module: Module });
        }

        await loan.update({ status }, { transaction: t });

        await ToolLoanStatusHistory.create({
            tool_loan_id: id,
            status,
            observations: observations || null,
            changed_by: fkUser,
            date: new Date(),
        }, { transaction: t });

        await t.commit();

        return res.status(httpStatus.OK).json({
            message: "Estado actualizado correctamente",
            module: Module
        });
    } catch (error) {
        await t.rollback();
        console.error("Error al cambiar estado:", error);
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
