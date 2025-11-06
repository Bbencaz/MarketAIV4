// Express backend server

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Simple test route
app.get('/', (req, res) => {
  res.send('✅ Backend server is running!');
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
