const express = require("express");
const manuscriptController = require("../controllers/manuscriptController");

const router = express.Router();

router.get("/pdf/:filename", manuscriptController.streamPublishedPdf);

module.exports = router;
