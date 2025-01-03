require('dotenv').config(); // Carrega variáveis de ambiente
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3001;

// Configuração do Pool PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Criar pasta "uploads" se não existir
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('Pasta "uploads" criada com sucesso!');
}

// Configuração do armazenamento de arquivos com multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Middleware
app.use(express.json());
app.use(cors());

// Rota para obter as fotos
app.get("/photos", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM photos');
    const photos = result.rows.map(photo => ({
      id: photo.id,
      src: `http://localhost:${port}/uploads/${photo.file_name}`,
      category: photo.category,
    }));
    res.json(photos);
  } catch (err) {
    res.status(500).json({ error: "Erro ao ler as fotos do banco de dados." });
  }
});

// Rota para enviar uma foto
app.post("/photos", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).send("Nenhuma imagem foi enviada.");

  const { filename } = req.file;
  const { category } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO photos (file_name, category) VALUES ($1, $2) RETURNING *',
      [filename, category]
    );

    const newPhoto = result.rows[0];
    res.json({
      id: newPhoto.id,
      src: `http://localhost:${port}/uploads/${newPhoto.file_name}`,
      category: newPhoto.category,
    });
  } catch (err) {
    res.status(500).send("Erro ao salvar a foto no banco de dados.");
  }
});

// Rota para deletar uma foto
app.delete("/photos/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT file_name FROM photos WHERE id = $1', [id]);
    const photo = result.rows[0];

    if (!photo) return res.status(404).send("Foto não encontrada.");

    const filePath = path.join(uploadsDir, photo.file_name);
    fs.unlink(filePath, async (err) => {
      if (err) return res.status(500).send("Erro ao deletar a foto.");

      await pool.query('DELETE FROM photos WHERE id = $1', [id]);
      res.sendStatus(200);
    });
  } catch (err) {
    res.status(500).send("Erro ao deletar foto.");
  }
});

// Servir imagens da pasta "uploads"
app.use("/uploads", express.static(uploadsDir));

// Inicializar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
