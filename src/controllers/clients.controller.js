const httpStatus = require("http-status");
const model = require("../models/clients");
const modelContact = require('../models/contactClient');
const Module = "client";

async function saveClient(req, res) {
    try {
        const data = req.body;

        const client = await model.create({
            nombre: data.nombre,
            nit: data.nit,
            direccion: data.direccion,
            company: data.company
        });

        const clientId = client.id;

        if (data.contacto_principal) {
            await modelContact.create({
                nombre: data.contacto_principal.nombre,
                cargo: data.contacto_principal.cargo,
                telefono: data.contacto_principal.telefono,
                correo: data.contacto_principal.correo,
                contactoPrincipal: 1,
                client: clientId,
                company: data.company
            });
        }

        if (Array.isArray(data.contactos_genericos) && data.contactos_genericos.length > 0) {
            const contactos = data.contactos_genericos.map(c => ({
                nombre: c.nombre,
                cargo: c.cargo,
                telefono: c.telefono,
                correo: c.correo,
                contactoPrincipal: 2,
                client: clientId,
                company: data.company
            }));

            await modelContact.bulkCreate(contactos);
        }

        res.status(httpStatus.OK).json({
            message: "Registro creado.",
            module: Module,
            data: client,
        });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error interno en el servidor: ${error.message}`,
            module: Module,
        });
    }
}

async function getClients(req, res) {
    try {
        const id = req.params.id;

        const clients = await model.findAll({
            where: { company: id },
            include: [
                {
                    model: modelContact,
                    as: 'contactos',
                    attributes: ['id', 'nombre', 'cargo', 'telefono', 'correo', 'contactoPrincipal'],
                },
            ],
            order: [['id', 'DESC']],
        });

        const formatted = clients.map(c => {
            const contactos = c.contactos.map(ct => ct.get({ plain: true }));

            const contacto_principal = contactos.find(ct => ct.contactoPrincipal == 1) || null;
            const contactos_genericos = contactos.filter(ct => ct.contactoPrincipal == 2);

            return {
                id: c.id,
                nombre: c.nombre,
                nit: c.nit,
                direccion: c.direccion,
                contacto_principal,
                contactos_genericos,
            };
        });
        res.status(httpStatus.OK).json({
            data: formatted,
            module: Module,
        });

    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error interno en el servidor: ${error.message}`,
            module: Module,
        });
    }
}

async function updateClient(req, res) {
    try {
        const data = req.body
        const { id } = req.params;

        const updated = await model.update(data, { where: { id } });
        res.status(httpStatus.OK).json({
            message: "Registro actualizado.",
            module: Module,
            data: updated,
        });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error interno en el servidor: ${error.message}`,
            module: Module,
        });
    }
}

async function deleteClient(req, res) {
    try {
        const id = req.params.id
        const deleted = await model.destroy({ where: { id } });

        if (deleted) {
            res.status(httpStatus.OK).json({
                message: "Registro eliminado.",
                module: Module
            });
        }
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error interno en el servidor: ${error.message}`,
            module: Module,
        })
    }
}

module.exports = {
    saveClient,
    updateClient,
    deleteClient,
    getClients
};