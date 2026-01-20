const express = require("express");
const {
  createBacklog,
  getBacklogs,
  patchBacklog,
  updateBacklog,
  deleteBacklog,
} = require("../controllers/backlogs");

const router = express.Router();

router.post("/", createBacklog);
router.get("/", getBacklogs);
router.patch("/:id", patchBacklog);
router.put("/:id", updateBacklog);
router.delete("/:id", deleteBacklog);

module.exports = router;
