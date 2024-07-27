const router = require('express').Router();
const protectedRoute = require('../../middleware/protected.route');
const controller = require("../../controllers/modules.controller");
const Module = "module";

const options = {
    Module: Module
}

router
    .get('/getModules', protectedRoute(options), controller.getModule)
    .post('/saveModule', protectedRoute(options), controller.saveModule)
    .put('/updateModule/:id', protectedRoute(options), controller.updateModule)
    .delete('/deleteModule/:id', protectedRoute(options), controller.deleteModule);

module.exports = router;
