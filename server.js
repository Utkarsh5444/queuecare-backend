const express = require('express'); 
const path = require('path');
const session = require('express-session');
const app = express();
const port = process.env.PORT || 3003;



// Serve static files (HTML, CSS, JS) from "public" folder
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());

// Firebase setup
const admin = require('firebase-admin');
const serviceAccount = require('./keys/serviceAccountKey.json');



admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://digital-queue-system-ca4a3-default-rtdb.firebaseio.com"
});

// **IMPORTANT: Configure and use express-session middleware BEFORE your routes!**
app.use(session({
  secret: 'your-secret-key', // Replace with a strong, random secret
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
  loggedIn: false// Set to true in production if using HTTPS
}));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
})
// Route: Home
app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Route: Login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Register route
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);
  admin.auth().createUser({
    email: email,
    password: password,
  })
  .then(userRecord => {
    res.status(201).json({ success: true, message: 'Registration successful!' });
  })
  .catch(error => {
    console.error('Error creating new user:', error);
    res.status(500).json({ success: false, message: 'Error registering user.',error });
  });
});

// Login route (Note: Admin SDK does not verify passwords directly)
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  admin.auth().getUserByEmail(email)
    .then(userRecord => {
      // NOTE: Cannot verify password on server using Admin SDK
      //res.status(200).json({ success: true, message: 'Login successful!' });
      req.session.loggedIn = true;
      req.session.username = userRecord.email;
      if(userRecord) {
        res.status(200).json({ success: true, message: 'Welcome '+userRecord.email });
      }
    })
    .catch(error => {
      console.error('Error fetching user data:', error);
      res.status(404).json({ success: false, message: 'Invalid email or password.' });
    });
});

app.get('/user', (req, res) => {
  if (req.session.loggedIn) {
    res.sendFile(path.join(__dirname, 'public', 'user.html'));
  }
})
// Start the server
app.listen(port, () => {
  console.log('Server running at http://localhost:'+port);
});
