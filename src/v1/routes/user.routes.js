const router = require("express").Router();
const userController = require("../../controllers/user.controller");
const protectedRoute = require("../../middleware/protected.route");
const Module = "user";

const options = {
      Module:Module
}

router.post("/saveUser", protectedRoute(options), userController.saveUser)
      .get('/getUser', protectedRoute(options), userController.getUser);

module.exports = router;