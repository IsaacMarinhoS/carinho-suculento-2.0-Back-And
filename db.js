const { Pool } = require('pg');

// Configuração de conexão com o banco de dados PostgreSQL
const pool = new Pool({
  user: 'Isaac', // Nome do usuário do banco de dados
  host: 'localhost',
  database: 'carinhosuculento', // Substitua com o nome do seu banco de dados
  password: 'carinho123', // Sua senha do banco de dados
  port: 5432, // Porta padrão do PostgreSQL
});

module.exports = pool;
