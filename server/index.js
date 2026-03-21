require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// CORS - allow frontend URL in production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.FRONTEND_URL,
  'https://market2home.vercel.app',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customer');
const vendorRoutes = require('./routes/vendor');
const riderRoutes = require('./routes/rider');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/rider', riderRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Market 2 Home API is running' });
});

// Serve React app for all non-API routes (in production)
app.use(express.static(path.join(__dirname, '../client/build')));
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../client/build', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.json({
        message: 'Market 2 Home API',
        version: '1.0',
        docs: 'API is running. Build the React frontend to serve the web app.',
      });
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Market 2 Home server running on port ${PORT}`);
});
