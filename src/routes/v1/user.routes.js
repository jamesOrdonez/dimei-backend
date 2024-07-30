const router = require("express").Router();
const userController = require("../../controllers/user.controller");
const protectedRoute = require("../../middleware/protected.route");
const Module = "user";

const options = {
  Module: Module,
};

router
  .post("/saveUser", userController.saveUser)
  .get("/getUser/:id", userController.getUser)
  .put("/updateUser/:id", userController.updateuser)
  .delete("/deleteuser/:id", userController.deleteUser);

module.exports = router;
