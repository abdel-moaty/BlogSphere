// index.js
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/BlogSphere', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Error connecting to MongoDB:', err));

// Passport configuration
passport.use(new LocalStrategy((username, password, done) => {
    User.findOne({ username: username })
        .then(user => {
            if (!user || !user.verifyPassword(password)) {
                return done(null, false, { message: 'Invalid username or password' });
            }
            return done(null, user);
        })
        .catch(err => done(err));
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/',
    failureFlash: true
}));

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
