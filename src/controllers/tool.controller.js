const httpStatus = require("http-status");
const Tool = require("../models/Tool");
const ToolGroup = require("../models/ToolGroup");
const ToolUnitOfMeasure = require("../models/ToolUnitOfMeasure");
const Module = "tool";
const fs = require("fs");
const path = require("path");
const uploadsDir = path.join(__dirname, "../../uploads");
const toolUploadsDir = path.join(uploadsDir, "tools");

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Ensure tools uploads directory exists
if (!fs.existsSync(toolUploadsDir)) {
  fs.mkdirSync(toolUploadsDir, { recursive: true });
}

// Create tool
async function saveTool(req, res) {
  try {
    let img = null;
    if (req.file) {
      const ext = path.extname(req.file.originalname);
      img = `tool-${Date.now()}${ext}`;
      fs.writeFileSync(path.join(toolUploadsDir, img), req.file.buffer);
    }

    const tool = await Tool.create({ ...req.body, img });

    res.status(httpStatus.CREATED).json({
      message: "Registro creado",
      module: Module,
      data: tool,
    });
  } catch (error) {
    console.error("❌ ERROR AL INSERTAR HERRAMIENTA:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor",
      error: error.message,
      module: Module,
    });
  }
}

// Get all tools for a company
async function getTools(req, res) {
  try {
    const companyId = req.params.id;
    const tools = await Tool.findAll({
      where: { company: companyId },
      order: [[{ model: ToolGroup, as: "ToolGroup" }, "name", "ASC"]],
      include: [
        { model: ToolGroup, attributes: ["id", "name"], as: "ToolGroup" },
        { model: ToolUnitOfMeasure, attributes: ["id", "unitOfMeasure"], as: "ToolUnitOfMeasure" },
      ],
    });

    const ToolLoanItem = require("../models/ToolLoanItem");
    const ToolLoan = require("../models/ToolLoan");

    const activeLoans = await ToolLoanItem.findAll({
      include: [{
        model: ToolLoan,
        as: 'toolLoan',
        where: { status: 'Prestado', company: companyId }
      }]
    });

    const lentMap = {};
    activeLoans.forEach(item => {
      const remaining = item.quantity - (item.returned_quantity || 0);
      lentMap[item.tool_id] = (lentMap[item.tool_id] || 0) + remaining;
    });

    const formattedTools = tools.map(t => {
      const toolData = t.toJSON();
      toolData.lent_amount = lentMap[t.id] || 0;
      return toolData;
    });

    res.status(httpStatus.OK).json({ data: formattedTools, module: Module });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor",
      error: error.message,
      module: Module,
    });
  }
}

// Get one tool by ID
async function getOneTool(req, res) {
  try {
    const id = req.params.id;
    const tool = await Tool.findByPk(id, {
      include: [
        { model: ToolGroup, attributes: ["id", "name"], as: "ToolGroup" },
        { model: ToolUnitOfMeasure, attributes: ["id", "unitOfMeasure"], as: "ToolUnitOfMeasure" },
      ],
    });

    if (!tool) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Herramienta no encontrada",
        module: Module,
      });
    }

    res.status(httpStatus.OK).json({
      data: tool,
      module: Module,
    });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor",
      module: Module,
    });
  }
}

// Update tool
async function updateTool(req, res) {
  try {
    const id = req.params.id;
    // eslint-disable-next-line no-unused-vars
    const { img: imgFromBody, ...bodyFields } = req.body;
    const updates = { ...bodyFields };

    if (req.file) {
      // Case 1: user uploaded a new image — replace the old one
      const currentTool = await Tool.findByPk(id);
      if (currentTool && currentTool.img) {
        const oldPath = path.join(toolUploadsDir, currentTool.img);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      const ext = path.extname(req.file.originalname);
      const filename = `tool-${Date.now()}${ext}`;
      fs.writeFileSync(path.join(toolUploadsDir, filename), req.file.buffer);
      updates.img = filename;
    } else if (imgFromBody === '') {
      // Case 2: user cleared the image (frontend sends img='') — delete file and set null
      const currentTool = await Tool.findByPk(id);
      if (currentTool && currentTool.img) {
        const oldPath = path.join(toolUploadsDir, currentTool.img);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updates.img = null;
    }
    // Case 3: imgFromBody is undefined → user didn't touch the image, keep existing

    const [updated] = await Tool.update(updates, { where: { id } });

    if (!updated) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "No se detectaron cambios en el registro",
        module: Module,
      });
    }

    const updatedTool = await Tool.findByPk(id, {
      include: [
        { model: ToolGroup, attributes: ["id", "name"], as: "ToolGroup" },
        { model: ToolUnitOfMeasure, attributes: ["id", "unitOfMeasure"], as: "ToolUnitOfMeasure" },
      ],
    });

    res.status(httpStatus.OK).json({
      message: "Registro actualizado",
      data: updatedTool,
      module: Module,
    });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor",
      module: Module,
    });
  }
}

// Delete tool
async function deleteTool(req, res) {
  try {
    const id = req.params.id;

    const tool = await Tool.findByPk(id);
    if (tool && tool.img) {
      const filePath = path.join(toolUploadsDir, tool.img);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    const deleted = await Tool.destroy({ where: { id } });

    if (!deleted) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Herramienta no encontrada",
        module: Module,
      });
    }

    res.status(httpStatus.OK).json({
      message: "Registro eliminado",
      module: Module,
    });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor",
      module: Module,
    });
  }
}

// Tool entrance (add quantity)
async function entranceTool(req, res) {
  try {
    const id = req.params.id;
    const { entranceAmount } = req.body;

    const tool = await Tool.findByPk(id);
    if (!tool) return res.status(httpStatus.NOT_FOUND).json({ message: "Herramienta no encontrada", module: Module });

    const currentAmount = Number(tool.amount || 0);
    const addAmount = Number(entranceAmount || 0);
    const newAmount = currentAmount + addAmount;

    await tool.update({ amount: newAmount });

    res.status(httpStatus.OK).json({
      message: "Cantidad actualizada",
      module: Module,
      data: tool,
    });
  } catch (error) {
    console.error("❌ ERROR EN ENTRADA DE HERRAMIENTA:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor",
      module: Module,
    });
  }
}

// Tool exit (subtract quantity)
async function exitTool(req, res) {
  try {
    const id = req.params.id;
    const { exitAmount } = req.body;

    const tool = await Tool.findByPk(id);
    if (!tool) return res.status(httpStatus.NOT_FOUND).json({ message: "Herramienta no encontrada", module: Module });

    const currentAmount = Number(tool.amount || 0);
    const subAmount = Number(exitAmount || 0);
    const newAmount = currentAmount - subAmount;

    await tool.update({ amount: newAmount });

    res.status(httpStatus.OK).json({
      message: "Cantidad actualizada",
      module: Module,
      data: tool,
    });
  } catch (error) {
    console.error("❌ ERROR EN SALIDA DE HERRAMIENTA:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor",
      module: Module,
    });
  }
}

// Get tool image
async function getToolImage(req, res) {
  try {
    const id = req.params.id;
    const tool = await Tool.findByPk(id, { attributes: ["img"] });

    if (!tool || !tool.img) return res.status(404).end();

    const filePath = path.join(toolUploadsDir, tool.img);
    if (!fs.existsSync(filePath)) return res.status(404).end();

    res.setHeader("Cache-Control", "public, max-age=86400");
    res.sendFile(filePath);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno", error });
  }
}

module.exports = {
  saveTool,
  getTools,
  getOneTool,
  updateTool,
  deleteTool,
  entranceTool,
  exitTool,
  getToolImage,
};
