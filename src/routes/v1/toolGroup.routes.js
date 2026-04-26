const router = require("express").Router();
const ToolGroupController = require("../../controllers/toolGroup.controller");
const protectedRoute = require("../../middleware/protected.route");
const Module = "tool_group";

const options = { Module };

router
  .get("/getToolGroup/:id", protectedRoute(options), ToolGroupController.getToolGroups)
  .get("/oneToolGroup/:id", protectedRoute(options), ToolGroupController.getOneToolGroup)
  .post("/saveToolGroup", protectedRoute(options), ToolGroupController.saveToolGroup)
  .put("/updateToolGroup/:id", protectedRoute(options), ToolGroupController.updateToolGroup)
  .delete("/deleteToolGroup/:id", protectedRoute(options), ToolGroupController.deleteToolGroup);

module.exports = router;
