const express = require("express");
const router = express.Router();
const { searchInstitutions, createInstitution } = require("../controllers/institutionController");

router.get("/search", searchInstitutions);
router.post("/", createInstitution);

module.exports = router;
