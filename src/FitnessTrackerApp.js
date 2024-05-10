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
  password: '<UPDATE-YOUR-MYSQL-DB-PASSWORD-HERE>',
  database: 'FitnessTracker'
});


connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});


app.use(bodyParser.json());

// Secret key for JWT
const JWT_SECRET = generateDynamicSecret();

//user registration
app.post('/register', async(req, res) => {
  const { username, password, dob, gender, fitness_goals, height, weight, preferred_workout_types, fitness_level } = req.body;

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
app.get('/users', verifyToken, async (req, res) => {
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
app.get('/users/:username',verifyToken, async (req, res) => {
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
app.put('/update/:username',verifyToken, (req, res) => {
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

//user Activity Logging
app.post('/activityLogging/:userName',verifyToken, (req, res) => {
  const userName = req.params.userName;
  const activityData = req.body;

  const sql = "INSERT INTO activity_logs (username, activity_type, duration_minutes, distance_km, intensity, calories_burned, log_date) VALUES (?, ?, ?, ?, ?, ?, ?)";

  const values = [userName, activityData.activity_type, activityData.duration_minutes, activityData.distance_km, activityData.intensity, activityData.calories_burned, activityData.log_date];

  connection.query(sql, values, (error, results, fields) => {
    if (error) {
      console.error('Error inserting activity log:', error);
      res.status(500).json({ error: 'Unable to update your activity log' });
    } else {
      res.status(201).json({ message: "Activity successfully logged !!"});
    }
  });
});

//get user's activity logging
app.get('/getActivityLogging/:userName', verifyToken, (req, res) => {
  const userName = req.params.userName;

  const sql = "SELECT * FROM activity_logs WHERE username = ?";

  connection.query(sql, [userName], (error, results, fields) => {
    if (error) {
      console.error('Error retrieving activity logs:', error);
      res.status(500).json({ error: 'Error retrieving activity logs' });
    } else {
      res.status(200).json(results);
    }
  });
});


//remove user from db
app.delete('/removeUser/:username', verifyToken, (req, res) => {
  const { username } = req.params;
  const userIDSQL = `SELECT id FROM users WHERE username = '${username}';`;

  connection.query(userIDSQL, (err, results) => {
    if (err) {
      console.error("Error executing SQL statement:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userID = results[0].id;

    console.log("User ID is ", userID);

    const deleteQuery = 'DELETE FROM users WHERE id = ?';

    connection.query(deleteQuery, [userID], (err, result) => {
      if (err) {
        console.error('Error removing the user from db:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      console.log('User removed successfully');
      res.status(200).json({ message: 'User removed successfully' });
    });
  });
});

//Validate the token for secure login
function verifyToken(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Token not provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = decoded;
    next();
  });
}

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

function generateDynamicSecret() {
  const randomString = Math.random().toString(20).substring(2, 10);
  const prefix = 'fitnessTrackerTest_';
  const dynamicSecret = prefix + randomString;
  return dynamicSecret;
}


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});