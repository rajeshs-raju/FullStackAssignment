const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


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

// Secret key for JWT
const JWT_SECRET = 'fitnesstracker!!';


  // Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Fetch user from the database based on username
  const query = `SELECT * FROM users WHERE username = ?`;
  connection.query(query, [username], async (err, results) => {
    if (err) {
      console.error('Error finding user:', err);
      return res.status(500).json({ error: 'An error occurred while finding user' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = results[0];

    // Check if the provided password matches the hashed password in the database
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Create JWT token
    const token = jwt.sign({ username: user.username, userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ token: token });
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


//update user details
app.put('/update/:username', (req, res) => {
  const { username } = req.params;
  const updatedUser = req.body;
  const sql = `SELECT id FROM users WHERE username = '${username}';`;

  console.log("Query is " , sql);

  connection.query(sql, (err, results) => {
    if (err) {
      console.error("Error executing SQL statement:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userID = results[0].id;

    console.log("User ID is ", userID);

    const updateQuery = `UPDATE users SET ? WHERE id = ?`;

    connection.query(updateQuery, [updatedUser, userID], (err, result) => {
      if (err) {
        console.error('Error updating user details:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      console.log('User details updated successfully');
      res.status(200).json({ message: 'User details updated successfully' });
    });

  });
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