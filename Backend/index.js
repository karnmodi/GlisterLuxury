const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/glister')
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Glister Backend API is running!' });
});

// API routes
app.use('/api/categories', require('./src/routes/categories.routes'));
app.use('/api/products', require('./src/routes/products.routes'));
app.use('/api/finishes', require('./src/routes/finishes.routes'));
app.use('/api/materials', require('./src/routes/materials.routes'));
app.use('/api/configurations', require('./src/routes/configurations.routes'));
app.use('/api/cart', require('./src/routes/cart.routes'));

// Error handler (must be last)
app.use(require('./src/middleware/errorHandler'));

// Start server (for local development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export for Vercel serverless
module.exports = app;
