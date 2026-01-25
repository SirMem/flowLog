const express = require("express");
const { getMe, putMe } = require("../controllers/me");

const router = express.Router();

router.get("/", getMe);
router.put("/", putMe);

module.exports = router;

