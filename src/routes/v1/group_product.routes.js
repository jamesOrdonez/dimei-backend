const router = require('express').Router();
const controller = require('../../controllers/group_product.controller');
const Module = 'group_product';

router.get('/getProductGroup/:id', controller.getGroupProducts)
    .post('/saveProductGroup', controller.saveGroupProduct)
    .put("/updateProductGroup/:id", controller.update)
    .delete('/deleteProductGroup/:id', controller.deleted)
    ;

module.exports = router;
