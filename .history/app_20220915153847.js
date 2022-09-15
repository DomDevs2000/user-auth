const express = require('express');

const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const { default: mongoose } = require('mongoose');
const LocalStrategy = require('passport-local').Strategy;
const Schema = mongoose.Schema;
// ----------------------------------------------------------------
async function db() {
	await mongoose.connect('mongodb://localhost:27017/user-auth');
	console.log('Connected to MongoDB');
}

// create mongoose model
const User = mongoose.model('User', new Schema({
    username: {type: String, required: true},
    password: {type: String, required: true},
})
// ----------------------------------------------------------------

db().catch((err) => console.log(err)))

// ----------------------------------------------------------------

const app = express();
app.set('views',__dirname);
app.set('view engine', 'pug');
app.use(session({secret:'test, resave: false, saveUtilise'}))
app.listen(3000, () => console.log('Hello World'));
