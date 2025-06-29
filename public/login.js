document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.container');
  const registerBtn = document.querySelector('.register-btn');
  const loginBtn = document.querySelector('.login-btn');

  registerBtn.addEventListener('click', () => container.classList.add('active'));
  loginBtn.addEventListener('click', () => container.classList.remove('active'));

  document.querySelector('.form-box.register form').addEventListener('submit', function (e) {
    e.preventDefault();

    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) return alert('Please enter a valid email.');
    if (password.length < 6) return alert('Password must be at least 6 characters.');

    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        return user.updateProfile({ displayName: username });
      })
      .then(() => {
        const user = firebase.auth().currentUser;
        return user.sendEmailVerification().then(() => {
          alert('Registration successful! Please verify your email.');
          container.classList.remove('active');
        });
      })
      .catch((error) => alert('Registration failed: ' + error.message));
  });

  document.querySelector('.form-box.login form').addEventListener('submit', function (e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) return alert("Invalid email.");
    if (password.length < 6) return alert("Password too short.");

    firebase.auth().signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        if (user.emailVerified) {
          alert('Login successful!');
          window.location.href = 'user.html';
        } else {
          user.sendEmailVerification().then(() => {
            alert('Please verify your email. A link has been sent.');
          });
          firebase.auth().signOut();
        }
      })
      .catch((error) => {
        if (error.code === 'auth/user-not-found') alert('No user found.');
        else if (error.code === 'auth/wrong-password') alert('Wrong password.');
        else alert('Login failed: ' + error.message);
      });
  });
});

function saveUserData(user) {
  firebase.database().ref("users/" + user.uid).set({
    name: user.displayName,
    email: user.email || "Not provided",
    profilePic: user.photoURL
  });
}

function googleLogin() {
  var provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then((result) => {
      saveUserData(result.user);
      alert("Login successful! Welcome " + result.user.displayName);
      window.location.href = 'user.html';
    })
    .catch((error) => alert("Google Login failed: " + error.message));
}

function facebookLogin() {
  var provider = new firebase.auth.FacebookAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then((result) => {
      saveUserData(result.user);
      alert("Login successful! Welcome " + result.user.displayName);
      window.location.href = 'user.html';
    })
    .catch((error) => alert("Facebook Login failed: " + error.message));
}

function twitterLogin() {
  var provider = new firebase.auth.TwitterAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then((result) => {
      saveUserData(result.user);
      alert("Login successful! Welcome " + result.user.displayName);
      window.location.href = 'user.html';
    })
    .catch((error) => alert("Twitter Login failed: " + error.message));
}

function githubLogin() {
  var provider = new firebase.auth.GithubAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then((result) => {
      saveUserData(result.user);
      alert("Login successful! Welcome " + result.user.displayName);
      window.location.href = 'user.html';
    })
    .catch((error) => alert("GitHub Login failed: " + error.message));
}
