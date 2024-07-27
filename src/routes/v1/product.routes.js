const router = require('express').Router();
const protectedRoute = require('../../middleware/protected.route');
const controller = require('../../controllers/product.controller');
const Module = 'product';

const options = {
    Module: Module
}

router
    .get('/getProduct', protectedRoute(options), controller.getproduct)
    .get('/getOneproduct/:id', protectedRoute(options), controller.getOneProduct)
    .post('/saveProduct', protectedRoute(options), controller.saveproduct)
    .put("/updateProduct/:id", protectedRoute(options), controller.updateProduct)
    .delete("/deleteproduct/:id", protectedRoute(options), controller.deleteProduct);

module.exports = router;

