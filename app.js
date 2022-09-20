const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const passport = require('passport');
const { default: mongoose } = require('mongoose');
const LocalStrategy = require('passport-local').Strategy;
const Schema = mongoose.Schema;
require('dotenv').config();

// ----------------------------------------------------------------
async function db() {
	await mongoose.connect(process.env.DB_URL);
	console.log('Connected to MongoDB');
}

// create mongoose model
const User = mongoose.model(
	'User',
	new Schema({
		username: { type: String, required: true },
		password: { type: String, required: true },
	})
);
// ----------------------------------------------------------------

db().catch((err) => console.log(err));

// --------------------------------------------------

const app = express();
app.set('views', __dirname);
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/styles'));
app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());

app.get('/', (req, res) => {
	res.render('index', { user: req.user });
});

app.get('/sign-up', (req, res) => {
	res.render('sign-up-form');
});

app.post('/sign-up', (req, res) => {
	const user = new User({
		username: req.body.username,
		password: req.body.password,
	}).save((err) => {
		if (err) {
			return next(err);
		}
		res.redirect('/');
	});
});

app.post(
	'/log-in',
	passport.authenticate('local', {
		successRedirect: '/',
		failureRedirect: '/',
	})
);

app.get('/log-out', (req, res, next) => {
	req.logout(function (err) {
		if (err) {
			return next(err);
		}
		res.redirect('/');
	});
});
// ----------------------------------------------------------------

passport.use(
	new LocalStrategy((username, password, done) => {
		User.findOne({ username: username }, (err, user) => {
			if (err) {
				return done(err);
			}
			if (!user) {
				return done(null, false, { message: 'incorrect Username' });
			}
			if (user.password !== password) {
				return done(null, false, { message: 'incorrect Password' });
			}
			return done(null, user);
		});
	})
);

passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	User.findById(id, function (err, user) {
		done(err, user);
	});
});

app.listen(process.env.SERVER_PORT, () =>
	console.log(`Server Listening On Port: ${process.env.SERVER_PORT}`)
);

// Autenticate Usernames Passwords -- Check if User Exists if not display information
// bcrypt / hash passwords

// bcrypt.hash('password', 10, (err, hashedPassword) => {
// 	if (err) {
// 		console.log('Failed to generate a new password');
// 	} else {
// 		password = hashedPassword;
// 	}
// });
// bcrypt.compare(password, user.password, (err, res) => {
// 	if (res) {
// 		// passwords match! log user in
// 		return done(null, user);
// 	} else {
// 		// passwords do not match!
// 		return done(null, false, { message: 'Incorrect password' });
// 	}
// });
