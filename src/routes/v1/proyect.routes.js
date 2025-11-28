const router = require('express').Router();
const controller = require('../../controllers/proyect.controller');
const protectedRoute = require('../../middleware/protected.route');
const Module = 'proyect';

const options = {
    Module: Module
}

router
    .get('/getProyect/:id', protectedRoute(options), controller.getProyects)
    .post('/saveproyect', protectedRoute(options), controller.saveProyect)
    .put('/updateProyect/:id', protectedRoute(options), controller.updateProyect)
    .delete('/deleteProyect/:id', protectedRoute(options), controller.deleteProyect)

module.exports = router;