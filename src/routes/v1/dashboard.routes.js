const express = require("express");
const router = express.Router();
const dashboardController = require("../../controllers/dashboard.controller");

router.get("/dashboard/stats/:companyId", dashboardController.getStats);

module.exports = router;
