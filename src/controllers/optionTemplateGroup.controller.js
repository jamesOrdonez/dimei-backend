const httpStatus = require("http-status");
const OptionTemplateGroup = require("../models/optionTemplateGroup");
const OptionTemplate = require("../models/optionTemplate");
const Module = "option_template";

OptionTemplateGroup.hasMany(OptionTemplate, { foreignKey: "group_id", as: "options" });
OptionTemplate.belongsTo(OptionTemplateGroup, { foreignKey: "group_id" });

// Safely convert any truthy/falsy representation to 1 or 0
const toBool = (v) => (v === true || v === 1 || v === '1' || v === 'true') ? 1 : 0;

async function getOptionTemplateGroups(req, res) {
  try {
    const { company } = req.params;
    const records = await OptionTemplateGroup.findAll({
      where: { company },
      order: [["id", "DESC"]],
      include: [{ model: OptionTemplate, as: "options", separate: true, order: [["sort_order", "ASC"]] }],
    });
    res.status(httpStatus.OK).json({ data: records, module: Module });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
}

async function saveOptionTemplateGroup(req, res) {
  try {
    const { name, company, options = [] } = req.body;
    const group = await OptionTemplateGroup.create({ name, company });
    if (options.length > 0) {
      await OptionTemplate.bulkCreate(
        options.map((o, i) => ({ group_id: group.id, text: o.text, requires_photo: toBool(o.requires_photo), sort_order: i }))
      );
    }
    const full = await OptionTemplateGroup.findByPk(group.id, { include: [{ model: OptionTemplate, as: "options" }] });
    res.status(httpStatus.CREATED).json({ data: full, module: Module, message: "Grupo creado" });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
}

async function updateOptionTemplateGroup(req, res) {
  try {
    const { id } = req.params;
    const { name, options = [] } = req.body;
    await OptionTemplateGroup.update({ name }, { where: { id } });
    // Sync options
    await OptionTemplate.destroy({ where: { group_id: id } });
    if (options.length > 0) {
      await OptionTemplate.bulkCreate(
        options.map((o, i) => ({ group_id: id, text: o.text, requires_photo: toBool(o.requires_photo), sort_order: i }))
      );
    }
    const full = await OptionTemplateGroup.findByPk(id, { include: [{ model: OptionTemplate, as: "options" }] });
    res.status(httpStatus.OK).json({ data: full, module: Module, message: "Grupo actualizado" });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
}

async function deleteOptionTemplateGroup(req, res) {
  try {
    const { id } = req.params;
    await OptionTemplate.destroy({ where: { group_id: id } });
    await OptionTemplateGroup.destroy({ where: { id } });
    res.status(httpStatus.OK).json({ module: Module, message: "Grupo eliminado" });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
}

module.exports = { getOptionTemplateGroups, saveOptionTemplateGroup, updateOptionTemplateGroup, deleteOptionTemplateGroup };
