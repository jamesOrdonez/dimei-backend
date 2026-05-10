const { Op } = require("sequelize");
const httpStatus = require("http-status");
const Proyect = require("../models/proyect");
const Item = require("../models/item");
const Remision = require("../models/remision");
const sequelize = require("../db/conection");

async function getStats(req, res) {
    try {
        const { companyId } = req.params;

        // 1. Projects by Status
        const projectsByStatus = await Proyect.findAll({
            attributes: [
                'state',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: { 
                company: companyId,
                tipo: 'proyecto'
            },
            group: ['state']
        });

        // 2. Total Counts for Widgets
        const totalProjects = await Proyect.count({ where: { company: companyId, tipo: 'proyecto' } });
        const totalEquipments = await Proyect.count({ where: { company: companyId, tipo: 'equipo' } });
        const totalItems = await Item.count({ where: { company: companyId } });
        const totalRemissions = await Remision.count({ where: { company: companyId } });
        
        // Items with Low Stock (amount < 10)
        const lowStockItems = await Item.count({
            where: {
                company: companyId,
                amount: { [Op.lt]: 10 }
            }
        });

        // 3. Monthly Remissions (Fall back to current date if NULL)
        const remissionsByMonth = await Remision.findAll({
            attributes: [
                [sequelize.fn('DATE_FORMAT', sequelize.literal('COALESCE(date, NOW())'), '%Y-%m'), 'month'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: {
                company: companyId
            },
            group: [sequelize.fn('DATE_FORMAT', sequelize.literal('COALESCE(date, NOW())'), '%Y-%m')],
            order: [[sequelize.fn('DATE_FORMAT', sequelize.literal('COALESCE(date, NOW())'), '%Y-%m'), 'ASC']]
        });

        // 4. Top 10 Items by Stock
        const topItems = await Item.findAll({
            attributes: ['description', 'amount'],
            where: { company: companyId },
            order: [['amount', 'DESC']],
            limit: 10
        });

        res.status(httpStatus.OK).json({
            projectsByStatus: projectsByStatus.map(p => ({
                state: p.state,
                count: Number(p.get('count'))
            })),
            totalProjects: Number(totalProjects),
            totalEquipments: Number(totalEquipments),
            totalItems: Number(totalItems),
            totalRemissions: Number(totalRemissions),
            lowStockItems: Number(lowStockItems),
            remissionsByMonth: remissionsByMonth.map(r => ({
                month: r.get('month'),
                count: Number(r.get('count'))
            })),
            topItems
        });

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Error interno al obtener estadísticas del dashboard",
            error: error.message
        });
    }
}

module.exports = { getStats };
