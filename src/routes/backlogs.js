const express = require("express");
const {
  createBacklog,
  getBacklogs,
  patchBacklog,
} = require("../controllers/backlogs");

const router = express.Router();

router.post("/", createBacklog);
router.get("/", getBacklogs);
router.patch("/:id", patchBacklog);

module.exports = router;

