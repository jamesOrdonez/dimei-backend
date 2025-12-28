const conection = require("../db/conection");
const httpStatus = require("http-status");
const Module = "item";

async function saveItems(req, res) {
  try {
    const {
      description,
      amount,
      group_item,
      position,
      price,
      variable,
      value1,
      mathOperation,
      value2,
      unitOfMeasure,
      user,
      company,
    } = req.body;

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
        position,
        price,
        variable,
        value1,
        mathOperation,
        value2,
        unitOfMeasure,
        user,
        company
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
      `,
      [
        safe(description),
        safe(amount),
        safe(group_item),
        safe(position),
        safe(price),
        safe(variable),
        safe(value1),
        safe(mathOperation),
        safe(value2),
        safe(unitOfMeasure),
        safe(user),
        safe(company),
      ]
    );

    return res.status(httpStatus.CREATED).json({
      message: "Registro creado",
      id: result.insertId,
      module: Module,
    });
  } catch (error) {
    console.error("❌ ERROR AL INSERTAR ITEM:", error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor",
      error: error.message,
      module: Module,
    });
  }
}

async function getItems(req, res) {
  try {
    const id = req.params.id;
    const data = await conection.execute(
      `SELECT i.id, description, amount, ig.name, i.position, price, variable, value1, mathOperation, value2, u.unitOfMeasure  FROM item i 
      left join unitofmeasure u on u.id = i.unitOfMeasure
      left join item_group ig on ig.id = i.group_item WHERE i.company = ? ORDER BY 1 DESC`,
      [id]
    );
    if (data) {
      res.status(httpStatus.OK).json({
        data: data[0],
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
    const id = req.params.id;

    const fields = [
      "description",
      "amount",
      "group_item",
      "position",
      "price",
      "variable",
      "value1",
      "mathOperation",
      "value2",
      "unitOfMeasure",
    ];

    const values = [];
    const updates = [];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    });

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
      message: "Registro actualizado",
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
      [id]
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
      [entranceAmount, id]
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
      [entranceAmount, id]
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
