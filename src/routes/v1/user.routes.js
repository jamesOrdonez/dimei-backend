const router = require("express").Router();
const userController = require("../../controllers/user.controller");
const protectedRoute = require("../../middleware/protected.route");
const Module = "user";

const options = {
      Module: Module
}

router.post("/saveUser", protectedRoute(options), userController.saveUser)
      .get('/getUser', protectedRoute(options), userController.getUser)
      .put("/updateUser/:id", protectedRoute(options), userController.updateuser)
      .delete("/deleteuser/:id", protectedRoute(options), userController.deleteUser);

module.exports = router;