const router = require('express').Router();
const controller = require('../../controllers/equipmentType.controller');
const protectedRoute = require('../../middleware/protected.route');
const Module = 'equipmenttype';

const options = {
    Module: Module
}

router
    .get('/eqType/:id', protectedRoute(options), controller.getEqType)
    .post('/saveEqType', protectedRoute(options), controller.saveEqType)
    .put('/updateEqTye/:id', protectedRoute(options), controller.updateEqType)
    .delete('/deleteEqtype/:id', protectedRoute(options), controller.deleteEqType);

module.exports = router;