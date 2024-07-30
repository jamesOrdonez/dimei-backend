const router = require("express").Router();
const protectedRoute = require("../../middleware/protected.route");
const controller = require("../../controllers/permission.controller");
const Module = "permission";

const options = {
    Module: Module
}

router
    .get("/getPermission", protectedRoute(options), controller.getPermissRol)
    .post("/savePermission", protectedRoute(options), controller.savePermission)
    .put("/updatePermission/:id", protectedRoute(options), controller.updatePermission)
    .delete("/deletePermission/:id", protectedRoute(options), controller.deletePermission);

module.exports = router;