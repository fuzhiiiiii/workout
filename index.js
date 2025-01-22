const express = require('express');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = 5000;

const secretKey = 'your-secret-key';  // Secret key for JWT authentication

// Middleware for authentication using JWT
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];  // Extract token from Authorization header

    if (!token) {
        return res.status(401).send('Access denied, no token provided');
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            return res.status(403).send('Invalid token');
        }
        req.user = user;  // Attach the decoded user to the request object
        next();
    });
};

app.use(express.static('public'));
app.use(express.json());

// In-memory users (for now)
let users = [];

// Path to the workouts JSON file
const dataFilePath = 'workouts.json';

// Function to load workouts from the JSON file
function loadWorkouts() {
    try {
        const data = fs.readFileSync(dataFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading workouts:', error);
        return [];
    }
}

// Function to save workouts to the JSON file
function saveWorkouts(workouts) {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(workouts, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving workouts:', error);
    }
}

// Route to get all workouts
app.get('/workouts', authenticateToken, (req, res) => {
    const workouts = loadWorkouts();
    res.json(workouts);
});

// Route to log a new workout
app.post('/log-workout', authenticateToken, (req, res) => {
    const { exercise, reps, sets } = req.body;
    if (!exercise || !reps || !sets) {
        return res.status(400).send('Please provide all workout details: exercise, reps, and sets.');
    }

    const newWorkout = { id: Date.now(), exercise, reps, sets, user: req.user.username };

    const workouts = loadWorkouts();
    workouts.push(newWorkout);
    saveWorkouts(workouts);

    res.send(`Logged: ${exercise} | Reps: ${reps} | Sets: ${sets}`);
});

// Route to delete a workout by ID
app.delete('/workouts/:id', authenticateToken, (req, res) => {
    const workoutId = parseInt(req.params.id);
    let workouts = loadWorkouts();

    // Check if the workout exists before deleting
    const workoutIndex = workouts.findIndex(workout => workout.id === workoutId);
    if (workoutIndex === -1) {
        return res.status(404).send('Workout not found');
    }

    // Remove the workout from the array
    workouts.splice(workoutIndex, 1);
    
    saveWorkouts(workouts);
    res.status(200).send('Workout deleted successfully');
});

// Register route (POST)
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    const hashedPassword = bcrypt.hashSync(password, 8);
    const newUser = { username, password: hashedPassword };
    users.push(newUser);

    res.status(201).send('User registered successfully');
});

// Login route (POST)
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    const user = users.find(u => u.username === username);

    if (!user) {
        return res.status(404).send('User not found');
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).send('Invalid password');
    }

    const token = jwt.sign({ username: user.username }, secretKey);
    res.json({ token });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
