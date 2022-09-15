const express = require('express');

const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const { default: mongoose } = require('mongoose');
const { nextTick } = require('process');
const LocalStrategy = require('passport-local').Strategy;
const Schema = mongoose.Schema;
// ----------------------------------------------------------------
async function db() {
	await mongoose.connect('mongodb://localhost:27017/user-auth');
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

// ----------------------------------------------------------------

const app = express();
app.set('views', __dirname);
app.set('view engine', 'ejs');
app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

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
			return nextTick(err);
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

app.listen(3000, () =>
	console.log('Server Listening at http://localhost:3000')
);
