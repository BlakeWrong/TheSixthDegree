const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use((req, res, next) => {
	if (req.headers['x-forwarded-proto'] !== 'https') {
		return res.redirect(`https://${req.headers.host}${req.url}`);
	}
	next();
});
app.use(cors());
app.use(express.json());

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '../sixdegrees/build')));

// API routes
const movieRoutes = require('./routes/movies');
const personRoutes = require('./routes/persons');
app.use('/api/movies', movieRoutes);
app.use('/api/persons', personRoutes);

// Catch-all route to serve React frontend for any non-API route
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, '../sixdegrees/build', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
