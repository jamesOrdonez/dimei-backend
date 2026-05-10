const router = require("express").Router();
const ctrl = require("../../controllers/maintenance.controller");
const protectedRoute = require("../../middleware/protected.route");

router.post("/saveMaintenanceReport", protectedRoute(), ctrl.saveMaintenanceReport);
router.get("/getMaintenanceReport/:id", protectedRoute(), ctrl.getMaintenanceReport);
router.get("/getAllMaintenanceReports/:company", protectedRoute(), ctrl.getAllMaintenanceReports);

module.exports = router;
