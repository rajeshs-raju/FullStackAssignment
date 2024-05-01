
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Create MySQL connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '<password>',
  database: 'FitnessTracker'
});

// Connect to MySQL
connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});

//parsing JSON body
app.use(bodyParser.json());

//user registration
app.post('/register', (req, res) => {
  const { username, password, dob, gender, fitness_goals, height, weight, preferred_workout_types, fitness_level } = req.body;

  // Insert user data into MySQL database
  const query = `INSERT INTO users (username, password, dob, gender, fitness_goals, height, weight, preferred_workout_types, fitness_level) 
 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  connection.query(query, [username, password, dob, gender, fitness_goals, height, weight, preferred_workout_types, fitness_level], (err, results) => {
    if (err) {
      console.error('Error registering user:', err);
      res.status(500).json({ error: 'An error occurred while registering user' });
    } else {
      console.log('User registered successfully');
      res.status(200).json({ message: 'User registered successfully' });
    }
  });
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});