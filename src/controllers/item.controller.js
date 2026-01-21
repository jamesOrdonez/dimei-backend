const conection = require("../db/conection");
const httpStatus = require("http-status");
const Module = "item";

async function saveItems(req, res) {
  try {
    const {
      description,
      amount,
      group_item,
      position1,
      position2,
      position3,
      price,
      variable,
      value1,
      mathOperation,
      value2,
      unitOfMeasure,
      user,
      company,
    } = req.body;

    const img = req.file ? req.file.buffer : null;

    const safe = (v) => {
      if (v === undefined || v === "" || Number.isNaN(v)) return null;
      return v;
    };

    const [result] = await conection.execute(
      `
      INSERT INTO item (
        description,
        amount,
        group_item,
        position1,
        position2,
        position3,
        price,
        variable,
        value1,
        mathOperation,
        value2,
        unitOfMeasure,
        user,
        company,
        img
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `,
      [
        safe(description),
        safe(amount),
        safe(group_item),
        safe(position1),
        safe(position2),
        safe(position3),
        safe(price),
        safe(variable),
        safe(value1),
        safe(mathOperation),
        safe(value2),
        safe(unitOfMeasure),
        safe(user),
        safe(company),
        img,
      ],
    );

    return res.status(201).json({
      message: "Registro creado",
      id: result.insertId,
    });
  } catch (error) {
    console.error("❌ ERROR AL INSERTAR ITEM:", error);
    return res.status(500).json({
      message: "Error interno en el servidor",
      error: error.message,
    });
  }
}

async function getItems(req, res) {
  try {
    const id = req.params.id;

    const [rows] = await conection.execute(
      `
      SELECT 
        i.id,
        i.description,
        i.amount,
        ig.name AS group_name,
        i.position1,
        i.position2,
        i.position3,
        i.price,
        i.variable,
        i.value1,
        i.mathOperation,
        i.value2,
        u.unitOfMeasure,
        i.img
      FROM item i
      LEFT JOIN unitofmeasure u ON u.id = i.unitOfMeasure
      LEFT JOIN item_group ig ON ig.id = i.group_item
      WHERE i.company = ?
      ORDER BY i.id DESC
      `,
      [id],
    );

    const data = rows.map((item) => ({
      ...item,
      img: item.img
        ? `data:image/jpeg;base64,${item.img.toString("base64")}`
        : null,
    }));

    return res.status(httpStatus.OK).json({
      data,
      module: Module,
    });
  } catch (error) {
    console.error(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor",
      error: error.message,
      module: Module,
    });
  }
}

async function getOneItem(req, res) {
  try {
    const id = req.params.id;
    const item = await conection.execute(`SELECT * FROM item WHERE id = ?`, [
      id,
    ]);
    if (item.length > 0) {
      res.status(httpStatus.OK).json({
        data: item,
        module: Module,
      });
    } else {
      res.status(httpStatus.NOT_FOUND).json({
        message: "Item not found",
        module: Module,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error}`,
      module: Module,
    });
  }
}

async function updateItem(req, res) {
  try {
    const { id } = req.params;

    const fields = [
      "description",
      "amount",
      "group_item",
      "position1",
      "position2",
      "position3",
      "price",
      "variable",
      "value1",
      "mathOperation",
      "value2",
      "unitOfMeasure",
    ];

    const updates = [];
    const values = [];

    fields.forEach((field) => {
      let value = req.body[field];
      console.log("img:" + value);
      if (value === undefined) return;

      if (value === null || value === "" || value === "undefined") {
        value = null;
      }

      if (field === "variable" && value !== null) {
        value = Number(value);
      }

      updates.push(`${field} = ?`);
      values.push(value);
    });

    if (req.file) {
      updates.push("img = ?");
      values.push(req.file.buffer);
    }

    console.log(req.file);
    if (updates.length === 0) {
      return res.status(400).json({
        message: "No hay datos para actualizar",
        module: Module,
      });
    }

    values.push(id);

    const sql = `
      UPDATE item
      SET ${updates.join(", ")}
      WHERE id = ?
    `;

    await conection.execute(sql, values);

    res.status(httpStatus.OK).json({
      message: "Registro actualizado correctamente",
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

async function deleteItem(req, res) {
  try {
    const id = req.params.id;

    const deleteItem = await conection.execute(
      `DELETE FROM item WHERE id = ?`,
      [id],
    );
    if (deleteItem) {
      res.status(httpStatus.OK).json({
        message: "Registro eliminado",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error}`,
      module: Module,
    });
  }
}

async function entranceItems(req, res) {
  try {
    const id = req.params.id;
    const { entranceAmount } = req.body;

    console.log(entranceAmount);

    const response = await conection.execute(
      `update item set amount = (amount + ?) where id = ?`,
      [entranceAmount, id],
    );

    if (response) {
      res.status(httpStatus.OK).json({
        message: "Registro creado",
        module: Module,
      });
    }
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor: " + error,
      module: Module,
    });
  }
}

async function exitItems(req, res) {
  try {
    const id = req.params.id;
    const { entranceAmount } = req.body;

    const response = await conection.execute(
      `update item set amount = (amount - ?) where id = ?`,
      [entranceAmount, id],
    );

    if (response) {
      res.status(httpStatus.OK).json({
        message: "Registro actualizado",
        module: Module,
      });
    }
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor: " + error,
      module: Module,
    });
  }
}

module.exports = {
  saveItems,
  getItems,
  getOneItem,
  updateItem,
  deleteItem,
  entranceItems,
  exitItems,
};
