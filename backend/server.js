const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');

dotenv.config();

const app = express();
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(express.json());
// app.use(cors());
app.use(cors({
  origin: 'http://localhost:8081', // Allow requests from your React Native app
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // can be comment Serve uploaded files statically

// MongoDB connection using local instance
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(' MongoDB connection error:', err));


// Comment out MongoDB Atlas connection for later use
// mongoose.connect('mongodb+srv://balmukundoptico:lets12help@job-connector.exb7v.mongodb.net', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
//   .then(() => console.log('MongoDB Atlas connected'))
//   .catch((err) => console.log('MongoDB Atlas connection error:', err));

// Root route
app.get('/', (req, res) => {
  res.send('Job Connector Backend is running');
});

// Import and mount routes
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const jobRoutes = require('./routes/jobRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/jobs', jobRoutes);

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// working code dont chnage