CREATE database FitnessTracker;

use FitnessTracker;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  dob DATE,
  gender ENUM('male', 'female', 'other'),
  fitness_goals TEXT,
  height FLOAT,
  weight FLOAT,
  preferred_workout_types TEXT,
  fitness_level ENUM('beginner', 'intermediate', 'advanced')
);

CREATE TABLE activity_logs (
  workout_ID INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255),
  activity_type ENUM('workout', 'run', 'walk', 'cycling', 'other'),
  duration_minutes INT,
  distance_km FLOAT,
  intensity ENUM('low', 'moderate', 'high'),
  calories_burned FLOAT,
  log_date DATE,
  FOREIGN KEY (username) REFERENCES users(username)
);

select id from users where username = 'tharun@test.org';


select * from activity_logs where username = 'Manasa';