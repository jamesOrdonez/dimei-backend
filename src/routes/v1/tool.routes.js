const router = require("express").Router();
const ToolController = require("../../controllers/tool.controller");
const { upload } = require("../../middleware/multer");
const protectedRoute = require("../../middleware/protected.route");
const Module = "tool";

const options = {
  Module: Module,
};

router
  .post(
    "/saveTool",
    upload.single("img"),
    protectedRoute(options),
    ToolController.saveTool,
  )
  .get("/getTool/:id", protectedRoute(options), ToolController.getTools)
  .get("/getTool/image/:id", ToolController.getToolImage)
  .get("/oneTool/:id", protectedRoute(options), ToolController.getOneTool)
  .put(
    "/updateTool/:id",
    upload.single("img"),
    protectedRoute(options),
    ToolController.updateTool,
  )
  .put("/entranceTool/:id", protectedRoute(options), ToolController.entranceTool)
  .put("/exitTool/:id", protectedRoute(options), ToolController.exitTool)
  .delete(
    "/deleteTool/:id",
    protectedRoute(options),
    ToolController.deleteTool,
  );

module.exports = router;
