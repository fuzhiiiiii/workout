// Show or hide the login/register forms and logged-in user interface
window.onload = function() {
    const token = localStorage.getItem('jwtToken');
    const loginFormContainer = document.getElementById('login-form-container');
    const registerFormContainer = document.getElementById('register-form-container');
    const logWorkoutForm = document.getElementById('log-workout-form');
    const workoutList = document.getElementById('workout-list');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (token) {
        // User is logged in
        loginFormContainer.style.display = 'none';
        registerFormContainer.style.display = 'none';
        logWorkoutForm.style.display = 'block';
        workoutList.style.display = 'block';
        logoutBtn.style.display = 'block';
        getWorkouts();  // Fetch workouts if user is logged in
    } else {
        // User is not logged in
        loginFormContainer.style.display = 'block';
        registerFormContainer.style.display = 'block';
        logWorkoutForm.style.display = 'none';
        workoutList.style.display = 'none';
        logoutBtn.style.display = 'none';
    }
};

// Register new user
document.getElementById('register-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        alert('User registered successfully');
        document.getElementById('register-form-container').style.display = 'none';
        document.getElementById('login-form-container').style.display = 'block';
    })
    .catch(err => alert('Error registering user'));
});

// Login user and store JWT token
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Login failed');
        }
        return response.json();
    })
    .then(data => {
        if (data.token) {
            localStorage.setItem('jwtToken', data.token);  // Store token in local storage
            window.location.reload();  // Refresh page to show logged-in state
        } else {
            alert('Invalid credentials');
        }
    })
    .catch(err => {
        alert('Error logging in: ' + err.message);
    });
});

// Get the workout list from the server
function getWorkouts() {
    const token = localStorage.getItem('jwtToken');

    if (!token) {
        alert('You need to login first.');
        return;
    }

    fetch('http://localhost:5000/workouts', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}` // Include token in the header for auth
        }
    })
    .then(response => response.json())
    .then(workouts => {
        const workoutList = document.getElementById('workout-list-items');
        workoutList.innerHTML = ''; // Clear the current list
        workouts.forEach(workout => {
            // Ensure workout has an id
            if (workout.id) {
                const li = document.createElement('li');
                li.innerHTML = `
                    Exercise: ${workout.exercise} | Reps: ${workout.reps} | Sets: ${workout.sets}
                    <button class="delete-btn" data-id="${workout.id}">Delete</button>
                `;
                workoutList.appendChild(li);
            } else {
                console.error('Workout missing ID:', workout);
            }
        });

        // Add event listeners to all delete buttons
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const workoutId = e.target.dataset.id;
                console.log("Deleting workout with ID:", workoutId);  // Debugging log
                deleteWorkout(workoutId);  // Call delete workout function
            });
        });
    })
    .catch(error => {
        console.error('Error fetching workouts:', error);
        alert('Error fetching workouts. Please try again.');
    });
}

// Function to delete a workout
function deleteWorkout(id) {
    const token = localStorage.getItem('jwtToken');
    console.log('Attempting to delete workout with ID:', id);  // Debugging log

    if (!id) {
        console.error('No ID provided for delete.');
        return;
    }

    fetch(`http://localhost:5000/workouts/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`  // Include token in the Authorization header
        }
    })
    .then(response => {
        if (response.ok) {
            alert('Workout deleted successfully');
            getWorkouts();  // Refresh the list of workouts
        } else {
            alert('Failed to delete workout');
        }
    })
    .catch(error => {
        console.error('Error deleting workout:', error);
        alert('Error deleting workout. Please try again.');
    });
}

// Handle the form submission to log a new workout
const form = document.getElementById('workout-form');
form.addEventListener('submit', async (e) => {
    e.preventDefault();  // Prevent form from submitting normally

    const exercise = document.getElementById('exercise').value;
    const reps = document.getElementById('reps').value;
    const sets = document.getElementById('sets').value;
    const token = localStorage.getItem('jwtToken');  // Get JWT token from localStorage

    const response = await fetch('http://localhost:5000/log-workout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,  // Include token in the Authorization header
        },
        body: JSON.stringify({ exercise, reps, sets }),
    });

    if (response.ok) {
        alert('Workout logged successfully');
        getWorkouts();  // Refresh the list of workouts
    } else {
        alert('Failed to log workout');
    }
});

// Logout the user
document.getElementById('logout-btn').addEventListener('click', function() {
    localStorage.removeItem('jwtToken');
    window.location.reload();  // Reload to show login/register forms again
});
