const router = require("express").Router();
const ctrl = require("../../controllers/technicianSignature.controller");
const protectedRoute = require("../../middleware/protected.route");

router
  .get("/getMySignatures/:userId", protectedRoute(), ctrl.getMySignatures)
  .post("/saveSignature", protectedRoute(), ctrl.saveSignature)
  .delete("/deleteSignature/:id", protectedRoute(), ctrl.deleteSignature);

module.exports = router;
