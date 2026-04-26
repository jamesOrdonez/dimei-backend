const router = require("express").Router();
const ToolLoanController = require("../../controllers/toolLoan.controller");
const protectedRoute = require("../../middleware/protected.route");
const Module = "tool_loan";
const options = { Module };

router
  .post("/saveToolLoan", protectedRoute(options), ToolLoanController.saveLoan)
  .get("/getToolLoan/:company", protectedRoute(options), ToolLoanController.getLoans)
  .put("/changeToolLoanStatus/:id", protectedRoute(options), ToolLoanController.changeStatus)
  .get("/toolLoanHistory/:id", protectedRoute(options), ToolLoanController.getStatusHistory);

module.exports = router;
