const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '<sqlPassword>',
  database: 'FitnessTracker'
});


connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});


app.use(bodyParser.json());


app.post('/register', async (req, res) => {
  const { username, password, dob, gender, fitness_goals, height, weight, preferred_workout_types, fitness_level } = req.body;

  // To encrypt and store the password in db
  const hashedPassword = await bcrypt.hash(password, 10);

  const query = `INSERT INTO users (username, password, dob, gender, fitness_goals, height, weight, preferred_workout_types, fitness_level) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  connection.query(query, [username, hashedPassword, dob, gender, fitness_goals, height, weight, preferred_workout_types, fitness_level], (err, results) => {
    if (err) {
      console.error('Error registering user:', err);
      res.status(500).json({ error: 'An error occurred while registering user' });
    } else {
      console.log('User registered successfully');
      res.status(200).json({ message: 'User registered successfully' });
    }
  });
});


//list all the user details
app.get('/users', async (req, res) => {
  try {
    // Retrieve all users from the database
    const users = await getAllUsersFromDatabase();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'An error occurred while fetching users' });
  }
});

// Endpoint to get details of a particular user by username
app.get('/users/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const user = await getGivenUserDetails(username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: 'An error occurred while fetching user details' });
  }
});

//function to get all the user details from database
async function getAllUsersFromDatabase() {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM users`;

    // Execute the query to retrieve all users
    connection.query(query, (err, results) => {
      if (err) {
        // If there's an error, reject the promise with an error
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

// function to get details about a specific user
async function getGivenUserDetails(username) {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM users WHERE username = ?`;

    connection.query(query, [username], (err, results) => {
      if (err) {
        reject(err);
      } else {
        if (results.length === 0) {
          resolve(null);
        } else {
          resolve(results[0]); 
        }
      }
    });
  });
}


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});