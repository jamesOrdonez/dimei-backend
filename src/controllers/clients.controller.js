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
        const { id } = req.params;
        const data = req.body;

        const cliente = await model.findByPk(id);
        if (!cliente) {
            return res.status(httpStatus.NOT_FOUND).json({
                message: "No se encontró el registro a actualizar.",
                module: Module,
            });
        }
        await cliente.update({
            nombre: data.nombre,
            nit: data.nit,
            direccion: data.direccion,
            company: data.company
        });

        if (data.contacto_principal) {
            const principal = await modelContact.findOne({
                where: { client: id, contactoPrincipal: 1 }
            });

            if (principal) {
                await principal.update({
                    nombre: data.contacto_principal.nombre,
                    cargo: data.contacto_principal.cargo,
                    telefono: data.contacto_principal.telefono,
                    correo: data.contacto_principal.correo,
                    company: data.company
                });
            } else {
                await modelContact.create({
                    nombre: data.contacto_principal.nombre,
                    cargo: data.contacto_principal.cargo,
                    telefono: data.contacto_principal.telefono,
                    correo: data.contacto_principal.correo,
                    contactoPrincipal: 1,
                    client: id,
                    company: data.company
                });
            }
        }

        const existingContacts = await modelContact.findAll({ where: { client: id, contactoPrincipal: 2 } });
        const existingIds = existingContacts.map(c => c.id);

        const incomingIds = data.contactos_genericos?.map(c => c.id).filter(Boolean) || [];

        const toDelete = existingIds.filter(id => !incomingIds.includes(id));
        if (toDelete.length > 0) {
            await modelContact.destroy({ where: { id: toDelete } });
        }

        if (Array.isArray(data.contactos_genericos)) {
            for (const c of data.contactos_genericos) {
                if (c.id) {
                    await modelContact.update(
                        {
                            nombre: c.nombre,
                            cargo: c.cargo,
                            telefono: c.telefono,
                            correo: c.correo,
                            company: data.company
                        },
                        { where: { id: c.id } }
                    );
                } else {
                    await modelContact.create({
                        nombre: c.nombre,
                        cargo: c.cargo,
                        telefono: c.telefono,
                        correo: c.correo,
                        contactoPrincipal: 2,
                        client: id,
                        company: data.company
                    });
                }
            }
        }

        const updatedClient = await model.findOne({
            where: { id },
            include: [
                {
                    model: modelContact,
                    as: "contactos",
                    attributes: ["id", "nombre", "cargo", "telefono", "correo", "contactoPrincipal"],
                },
            ],
        });

        const contactos = updatedClient.contactos.map(ct => ct.get({ plain: true }));
        const contacto_principal = contactos.find(ct => ct.contactoPrincipal == 1) || null;
        const contactos_genericos = contactos.filter(ct => ct.contactoPrincipal == 2);

        res.status(httpStatus.OK).json({
            message: "Registro actualizado.",
            module: Module,
            data: {
                id: updatedClient.id,
                nombre: updatedClient.nombre,
                nit: updatedClient.nit,
                direccion: updatedClient.direccion,
                contacto_principal,
                contactos_genericos,
            },
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