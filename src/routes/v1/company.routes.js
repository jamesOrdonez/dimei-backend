const protectedRoute = require('../../middleware/protected.route');
const router = require('express').Router();
const controller = require('../../controllers/company.controller');
const Module = "company";

const options = {
    Module: Module
};

router
    .get("/getCompany", protectedRoute(options), controller.getCompany)
    .post("/saveCompany", protectedRoute(options), controller.saveCompany)
    .put("/updateCompany/:id", protectedRoute(options), controller.updateCompany)
    .delete("/deleteCompany/:id", protectedRoute(options), controller.deleteCompany);

module.exports = router;
