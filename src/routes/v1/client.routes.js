const router = require('express').Router();
const controller = require('../../controllers/clients.controller');
const protectedRoute = require('../../middleware/protected.route');
const Module = 'client';

const options = {
    Module: Module
}

router
    .get("/getClientes/:id", protectedRoute(options), controller.getClients)
    .post("/saveCliente", protectedRoute(options), controller.saveClient)
    .put("/updateCliente/:id", protectedRoute(options), controller.updateClient)
    .delete("/deleteCliente/:id", protectedRoute(options), controller.deleteClient);

module.exports = router