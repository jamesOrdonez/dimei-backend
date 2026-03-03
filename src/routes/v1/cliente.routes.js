const router = require('express').Router();


router
    .get("/getClientes", (req, res) => {
        res.status(200).json({
            module: "cliente",
            data: []
        });
    })

module.exports = router;
