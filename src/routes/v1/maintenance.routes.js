const router = require("express").Router();
const ctrl = require("../../controllers/maintenance.controller");
const protectedRoute = require("../../middleware/protected.route");

router.post("/saveMaintenanceReport", protectedRoute(), ctrl.saveMaintenanceReport);

module.exports = router;
