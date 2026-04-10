const express = require("express");
const path = require("path");

const app = express();

// API continua normal
app.use("/api", require("./routes")); // exemplo

// servir frontend
app.use(express.static(path.join(__dirname, "../dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

// porta do Render
const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Server rodando na porta ${port}`);
});