const router = require("express").Router();
const controller = require("../../controllers/rol.controller");
const { verifyToken } = require("../../middleware/protected.route");

router
    .get("/getRoles/:company", verifyToken, controller.getRoles)
    .post("/saveRol", verifyToken, controller.saveRol)
    .put("/updateRol/:id", verifyToken, controller.updateRol)
    .delete("/deleteRol/:id", verifyToken, controller.deleteRol);

module.exports = router;
