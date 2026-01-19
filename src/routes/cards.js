const express = require("express");
const { createCard, getCards, updateCard, deleteCard } = require("../controllers/cards");

const router = express.Router();

router.post("/", createCard);
router.get("/", getCards);
router.put("/:id", updateCard);
router.delete("/:id", deleteCard);

module.exports = router;

