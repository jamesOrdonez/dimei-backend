const httpStatus = require("http-status");
const QuestionGroup = require("../models/questionGroup");
const Question = require("../models/question");
const AnswerOption = require("../models/answerOption");
const Module = "question";

// ── Relations (eager loading) ─────────────────────────────────────────────────
QuestionGroup.hasMany(Question, { foreignKey: "group_id", as: "questions" });
Question.belongsTo(QuestionGroup, { foreignKey: "group_id", as: "group" });
Question.hasMany(AnswerOption, { foreignKey: "question_id", as: "options" });
AnswerOption.belongsTo(Question, { foreignKey: "question_id", as: "question" });

// Safely convert any truthy/falsy representation to 1 or 0
const toBool = (v) => (v === true || v === 1 || v === '1' || v === 'true') ? 1 : 0;


// ── Question Groups ───────────────────────────────────────────────────────────

async function getQuestionGroups(req, res) {
  try {
    const { company } = req.params;
    const records = await QuestionGroup.findAll({
      where: { company },
      order: [["sort_order", "ASC"], ["id", "ASC"]],
      include: [
        {
          model: Question,
          as: "questions",
          order: [["order", "ASC"]],
          separate: true,
          include: [{ model: AnswerOption, as: "options", separate: true, order: [["id", "ASC"]] }],
        },
      ],
    });
    res.status(httpStatus.OK).json({ data: records, module: Module });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message, module: Module });
  }
}

async function getOneQuestionGroup(req, res) {
  try {
    const { id } = req.params;
    const record = await QuestionGroup.findByPk(id, {
      include: [
        {
          model: Question,
          as: "questions",
          order: [["order", "ASC"]],
          separate: true,
          include: [{ model: AnswerOption, as: "options", separate: true, order: [["id", "ASC"]] }],
        },
      ],
    });
    if (!record) return res.status(httpStatus.NOT_FOUND).json({ message: "Grupo no encontrado", module: Module });
    res.status(httpStatus.OK).json({ data: record, module: Module });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message, module: Module });
  }
}

async function saveQuestionGroup(req, res) {
  try {
    const { name, company } = req.body;
    const record = await QuestionGroup.create({ name, company });
    res.status(httpStatus.CREATED).json({ data: record, module: Module, message: "Grupo creado" });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message, module: Module });
  }
}

async function updateQuestionGroup(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    await QuestionGroup.update({ name }, { where: { id } });
    const record = await QuestionGroup.findByPk(id);
    res.status(httpStatus.OK).json({ data: record, module: Module, message: "Grupo actualizado" });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message, module: Module });
  }
}

async function deleteQuestionGroup(req, res) {
  try {
    const { id } = req.params;
    // Delete children first
    const questions = await Question.findAll({ where: { group_id: id } });
    for (const q of questions) {
      await AnswerOption.destroy({ where: { question_id: q.id } });
    }
    await Question.destroy({ where: { group_id: id } });
    await QuestionGroup.destroy({ where: { id } });
    res.status(httpStatus.OK).json({ module: Module, message: "Grupo eliminado" });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message, module: Module });
  }
}

// ── Questions ─────────────────────────────────────────────────────────────────

async function saveQuestion(req, res) {
  try {
    const { group_id, text, type, min_photos, max_photos, order, options } = req.body;
    const question = await Question.create({ group_id, text, type, min_photos, max_photos, order: order || 0 });

    if (options && options.length > 0) {
      const opts = options.map((o) => ({ 
        question_id: question.id, 
        text: o.text, 
        requires_photo: toBool(o.requires_photo),
        requires_justification: toBool(o.requires_justification)
      }));
      await AnswerOption.bulkCreate(opts);
    }

    const full = await Question.findByPk(question.id, { include: [{ model: AnswerOption, as: "options", separate: true, order: [["id", "ASC"]] }] });
    res.status(httpStatus.CREATED).json({ data: full, module: Module, message: "Pregunta creada" });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message, module: Module });
  }
}

async function updateQuestion(req, res) {
  try {
    const { id } = req.params;
    const { text, type, min_photos, max_photos, order, options } = req.body;

    await Question.update({ text, type, min_photos, max_photos, order }, { where: { id } });

    // Sync options: delete all and re-insert
    await AnswerOption.destroy({ where: { question_id: id } });
    if (options && options.length > 0) {
      const opts = options.map((o) => ({ 
        question_id: id, 
        text: o.text, 
        requires_photo: toBool(o.requires_photo),
        requires_justification: toBool(o.requires_justification)
      }));
      await AnswerOption.bulkCreate(opts);
    }

    const full = await Question.findByPk(id, { include: [{ model: AnswerOption, as: "options", separate: true, order: [["id", "ASC"]] }] });
    res.status(httpStatus.OK).json({ data: full, module: Module, message: "Pregunta actualizada" });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message, module: Module });
  }
}

async function deleteQuestion(req, res) {
  try {
    const { id } = req.params;
    await AnswerOption.destroy({ where: { question_id: id } });
    await Question.destroy({ where: { id } });
    res.status(httpStatus.OK).json({ module: Module, message: "Pregunta eliminada" });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message, module: Module });
  }
}

async function reorderQuestionGroups(req, res) {
  try {
    const { order } = req.body; // [{ id, sort_order }]
    await Promise.all(order.map(({ id, sort_order }) => QuestionGroup.update({ sort_order }, { where: { id } })));
    res.status(httpStatus.OK).json({ message: "Orden actualizado", module: Module });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message, module: Module });
  }
}

async function reorderQuestions(req, res) {
  try {
    const { order } = req.body; // [{ id, order }]
    await Promise.all(order.map(({ id, order: ord }) => Question.update({ order: ord }, { where: { id } })));
    res.status(httpStatus.OK).json({ message: "Orden actualizado", module: Module });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message, module: Module });
  }
}

module.exports = {
  getQuestionGroups,
  getOneQuestionGroup,
  saveQuestionGroup,
  updateQuestionGroup,
  deleteQuestionGroup,
  saveQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestionGroups,
  reorderQuestions,
};
