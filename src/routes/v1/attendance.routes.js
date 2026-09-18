const router = require("express").Router();
const controller = require("../../controllers/attendance.controller");
const { verifyToken } = require("../../middleware/protected.route");

router
    // Marcaciones del usuario autenticado
    .post("/markTime", verifyToken, controller.markTime)
    .get("/myRecord", verifyToken, controller.getMyRecord)
    .get("/myRecordHistory", verifyToken, controller.getMyRecordHistory)

    // Horarios por rol
    .get("/scheduleByRol/:rolId/:company", verifyToken, controller.getScheduleByRol)
    .get("/allSchedules/:company", verifyToken, controller.getAllSchedules)
    .post("/saveSchedule", verifyToken, controller.saveSchedule)

    // Reportes y festivos (admin)
    .get("/overtimeReport", verifyToken, controller.getOvertimeReport)
    .get("/locationReport", verifyToken, controller.getLocationReport)
    .post("/markHoliday", verifyToken, controller.markHoliday);

module.exports = router;
