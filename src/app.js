const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

// dotenv for local dev only; in Cloud Run environment vars are injected by platform.
if (process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line global-require
  require("dotenv").config();
}

const { initDb } = require("./config/db");
const { requireOpenId } = require("./middlewares/auth");
const { notFound, errorHandler } = require("./middlewares/error");
const cardsRouter = require("./routes/cards");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("tiny"));

app.get("/health", (req, res) => {
  res.json({ code: 0, msg: "success", data: { ok: true } });
});

// All business APIs require openid isolation.
app.use(requireOpenId);
app.use("/cards", cardsRouter);

app.use(notFound);
app.use(errorHandler);

async function main() {
  await initDb();

  const port = Number(process.env.PORT || 80);
  app.listen(port, () => {
    console.log(`FlowLog backend listening on :${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
