const router = require("express").Router();
const userController = require("../../controllers/user.controller");
const Module = "user";

router.post("/saveUser", userController.saveUser)
      .get('/getUser', userController.getUser);

module.exports = router;