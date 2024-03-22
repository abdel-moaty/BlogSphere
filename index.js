const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/User');
const errorHandler = require('./errorHandler');
const Post = require('./models/Post');
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

// Logout route
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Custom middleware to check if user is authenticated
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login'); // Redirect to login page if not authenticated
}

// Add a new route for handling post creation
app.get('/new', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'new.html'));
});

// Handle form submission for creating new posts
app.post('/new', ensureAuthenticated, (req, res) => {
    const { title, content } = req.body;
    const newPost = { title, content, author: req.user._id };

    // Save the new post to the database
    Post.create(newPost)
        .then(() => {
            res.redirect('/');
        })
        .catch(err => {
            console.error('Error creating new post:', err);
            res.redirect('/');
        });
});
