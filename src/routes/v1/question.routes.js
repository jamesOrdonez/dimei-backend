const router = require("express").Router();
const ctrl = require("../../controllers/question.controller");
const protectedRoute = require("../../middleware/protected.route");
const Module = "question";
const options = { Module };

router
  .get("/getQuestionGroups/:company", protectedRoute(options), ctrl.getQuestionGroups)
  .post("/saveQuestionGroup", protectedRoute(options), ctrl.saveQuestionGroup)
  .put("/updateQuestionGroup/:id", protectedRoute(options), ctrl.updateQuestionGroup)
  .delete("/deleteQuestionGroup/:id", protectedRoute(options), ctrl.deleteQuestionGroup)
  .post("/saveQuestion", protectedRoute(options), ctrl.saveQuestion)
  .put("/updateQuestion/:id", protectedRoute(options), ctrl.updateQuestion)
  .delete("/deleteQuestion/:id", protectedRoute(options), ctrl.deleteQuestion)
  .post("/reorderQuestionGroups", protectedRoute(options), ctrl.reorderQuestionGroups)
  .post("/reorderQuestions", protectedRoute(options), ctrl.reorderQuestions);

module.exports = router;
