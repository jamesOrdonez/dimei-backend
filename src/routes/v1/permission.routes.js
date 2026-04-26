const router = require("express").Router();
const { verifyToken } = require("../../middleware/protected.route");
const controller = require("../../controllers/permission.controller");

router
    .get("/getPermissions/:id", verifyToken, controller.getPermissRol)
    .post("/syncPermissions", verifyToken, controller.syncPermissions)
    .get("/getMyPermissions", verifyToken, controller.getMyPermissions);

module.exports = router;