const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String },
    bio: { type: String },
    // Add any other fields you need for the user model
});

const User = mongoose.model('User', userSchema);

module.exports = User;
