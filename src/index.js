const express = require('express');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('./middleware/authMiddleware');

const app = express();
app.use(express.json());

require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;

// Endpoint público para gerar token
app.post('/login', (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ message: 'Informe um username' });
  }

  const user = { id: 1, name: username };
  const token = jwt.sign(user, SECRET_KEY, { expiresIn: '1h' });

  res.json({ token });
});

// Rota protegida
app.get('/api/rides/history', authenticateToken, (req, res) => {
  res.json({ message: 'Histórico de rides', user: req.user });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
