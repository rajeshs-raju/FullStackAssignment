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