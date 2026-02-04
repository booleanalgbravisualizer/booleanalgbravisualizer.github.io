const express = require('express');
const app = express();
const port = 3000;

// Serve static files
app.use(express.static('public'));
app.use(express.static('assets'));
app.use(express.json());

// API endpoint to parse boolean expression and generate data
app.post('/api/parse', (req, res) => {
  const { expression } = req.body;
  
  if (!expression) {
    return res.status(400).json({ error: 'Expression is required' });
  }

  try {
    const parser = require('./public/parser');
    const result = parser.parseExpression(expression);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
