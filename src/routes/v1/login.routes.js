const router = require("express").Router();
const loginController = require("../../auth/login");
const Module = "login";

router.post("/login", loginController.login);

module.exports = router;