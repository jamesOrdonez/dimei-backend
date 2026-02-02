const router = require("express").Router();
const remisionController = require("../../controllers/remision.controller");
const protectedRoute = require("../../middleware/protected.route");
const Module = "remision";

const options = {
    Module: Module,
};

router
    .post(
        "/saveRemision",
        remisionController.save,
    )

module.exports = router;
