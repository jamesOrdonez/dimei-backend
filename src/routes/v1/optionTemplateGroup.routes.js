const router = require("express").Router();
const ctrl = require("../../controllers/optionTemplateGroup.controller");
const protectedRoute = require("../../middleware/protected.route");
const Module = "option_template";
const options = { Module };

router
  .get("/getOptionTemplateGroups/:company", protectedRoute(options), ctrl.getOptionTemplateGroups)
  .post("/saveOptionTemplateGroup", protectedRoute(options), ctrl.saveOptionTemplateGroup)
  .put("/updateOptionTemplateGroup/:id", protectedRoute(options), ctrl.updateOptionTemplateGroup)
  .delete("/deleteOptionTemplateGroup/:id", protectedRoute(options), ctrl.deleteOptionTemplateGroup);

module.exports = router;
