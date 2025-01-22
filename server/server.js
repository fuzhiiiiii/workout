const express = require('express');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors'); // Enable CORS if frontend and backend are on different ports

const app = express();
const port = 5000;

const secretKey = 'your-secret-key';

app.use(cors()); // Enable CORS for all requests
app.use(express.static('public'));
app.use(express.json());

// In-memory users (For production, use a real database)
let users = [];

// Path to the workouts JSON file
const dataFilePath = 'workouts.json';
const usersFilePath = 'users.json';

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

// Function to load users from the JSON file
function loadUsers() {
    try {
        const data = fs.readFileSync(usersFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading users:', error);
        return [];
    }
}

// Function to save users to the JSON file
function saveUsers(users) {
    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving users:', error);
    }
}

// Middleware to authenticate using JWT
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) {
        return res.status(401).send('Access denied, no token provided');
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            return res.status(403).send('Invalid token');
        }
        req.user = user;
        next();
    });
};

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

    const workouts = loadWorkouts();
    const newWorkout = {
        id: workouts.length ? Math.max(workouts.map(workout => workout.id)) + 1 : 1,
        exercise, 
        reps, 
        sets, 
        user: req.user.username
    };

    workouts.push(newWorkout);
    saveWorkouts(workouts);
    res.status(201).json(newWorkout);
});

// DELETE a workout by ID
app.delete('/workouts/:id', authenticateToken, (req, res) => {
    const workoutId = parseInt(req.params.id);
    let workouts = loadWorkouts();

    const workoutIndex = workouts.findIndex(workout => workout.id === workoutId);
    if (workoutIndex === -1) {
        return res.status(404).send('Workout not found');
    }

    workouts.splice(workoutIndex, 1);
    saveWorkouts(workouts);
    res.status(200).send('Workout deleted successfully');
});

// Register route
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    const users = loadUsers();
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
        return res.status(400).send('User already exists');
    }

    const hashedPassword = bcrypt.hashSync(password, 8);
    const newUser = { username, password: hashedPassword };
    users.push(newUser);
    saveUsers(users);
    res.status(201).send('User registered successfully');
});

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    const users = loadUsers();
    const user = users.find(u => u.username === username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(400).send('Invalid credentials');
    }

    const token = jwt.sign({ username: user.username }, secretKey, { expiresIn: '1h' });
    res.json({ token });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on https://fuzhi-68d2c510d713.herokuapp.com/`);
});
