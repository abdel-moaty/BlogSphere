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

// Logging middleware for request tracking
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    const clientIP = req.ip;

    console.log(`[${timestamp}] ${method} ${url} - IP: ${clientIP}`);

    next();
});

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

// Modify the route handler for the homepage to fetch all posts
app.get('/', (req, res) => {
    Post.find()
        .populate('author') // Populate the 'author' field with user details
        .exec((err, posts) => {
            if (err) {
                console.error('Error fetching posts:', err);
                res.status(500).send('Internal Server Error');
            } else {
                res.render('index', { posts: posts, user: req.user });
            }
        });
});


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

// Error handling middleware for ensureAuthenticated middleware
app.use((err, req, res, next) => {
    console.error('Authentication error:', err);
    res.status(500).send('Authentication error');
});

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

// Add a new route for viewing individual posts
app.get('/post/:postId', (req, res) => {
    const postId = req.params.postId;

    Post.findById(postId)
        .populate('author') // Populate the 'author' field with user details
        .exec((err, post) => {
            if (err || !post) {
                console.error('Error fetching post:', err);
                res.status(404).send('Post not found');
            } else {
                res.render('post', { post: post, user: req.user });
            }
        });
});

// Add a new route for editing existing posts
app.get('/edit/:postId', ensureAuthenticated, (req, res) => {
    const postId = req.params.postId;

    Post.findById(postId)
        .populate('author') // Populate the 'author' field with user details
        .exec((err, post) => {
            if (err || !post) {
                console.error('Error fetching post:', err);
                res.status(404).send('Post not found');
            } else {
                // Check if the logged-in user is the author of the post
                if (post.author.equals(req.user._id)) {
                    res.render('edit', { post: post });
                } else {
                    res.status(403).send('Forbidden');
                }
            }
        });
});

// Handle form submission for updating existing posts
app.post('/edit/:postId', ensureAuthenticated, (req, res) => {
    const postId = req.params.postId;
    const { title, content } = req.body;

    // Find the post by ID and update its title and content
    Post.findByIdAndUpdate(postId, { title: title, content: content }, { new: true })
        .then(updatedPost => {
            res.redirect(`/post/${postId}`);
        })
        .catch(err => {
            console.error('Error updating post:', err);
            res.redirect('/');
        });
});

// Add a new route for deleting posts
app.post('/delete/:postId', ensureAuthenticated, (req, res) => {
    const postId = req.params.postId;

    // Find the post by ID and delete it
    Post.findByIdAndDelete(postId)
        .then(() => {
            res.redirect('/');
        })
        .catch(err => {
            console.error('Error deleting post:', err);
            res.redirect('/');
        });
});

// Add route for viewing user profile
app.get('/profile', ensureAuthenticated, (req, res) => {
    // Fetch the currently authenticated user's details
    const userId = req.user._id;

    User.findById(userId)
        .populate('posts') // Populate the 'posts' field with user's authored posts
        .exec((err, user) => {
            if (err || !user) {
                console.error('Error fetching user profile:', err);
                res.status(500).send('Internal Server Error');
            } else {
                res.render('profile', { user: user });
            }
        });
});

// Add a new route for submitting comments
app.post('/comment/:postId', ensureAuthenticated, (req, res) => {
    const postId = req.params.postId;
    const { content } = req.body;

    // Find the post by ID and add a new comment
    Post.findById(postId)
        .then(post => {
            if (!post) {
                console.error('Post not found');
                res.status(404).send('Post not found');
            } else {
                const newComment = {
                    content: content,
                    author: req.user._id
                };
                post.comments.push(newComment);
                return post.save();
            }
        })
        .then(() => {
            res.redirect(`/post/${postId}`);
        })
        .catch(err => {
            console.error('Error adding comment:', err);
            res.redirect(`/post/${postId}`);
        });
});

// Add route for user registration form
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

// Handle user registration form submission
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    // Validate username and password
    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    // Check if username already exists
    User.findOne({ username: username })
        .then(user => {
            if (user) {
                return res.status(400).send('Username already exists');
            }
            // Create new user
            return User.create({ username: username, password: password });
        })
        .then(newUser => {
            res.redirect('/login'); // Redirect to login page after successful registration
        })
        .catch(err => {
            console.error('Error registering user:', err);
            res.status(500).send('Internal Server Error');
        });
});

// Add route for user login form
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Handle user login form submission
app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

// Error handling middleware for invalid routes
app.use((req, res, next) => {
    res.status(404).send('404 Not Found');
});
