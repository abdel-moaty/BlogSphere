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
