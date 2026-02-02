const router = require("express").Router();
const userController = require("../../controllers/user.controller");
const protectedRoute = require("../../middleware/protected.route");
const Module = "user";

const options = {
  Module: Module,
};

router
  .post("/saveUser", protectedRoute(options), userController.saveUser)
  .get("/getUser/:id", protectedRoute(options), userController.getUser)
  .get("/getOneUser/:id", protectedRoute(options), userController.getOneUser)
  .put("/updateUser/:id", protectedRoute(options), userController.updateuser)
  .delete(
    "/deleteuser/:id",
    protectedRoute(options),
    userController.deleteUser
  );

module.exports = router;
