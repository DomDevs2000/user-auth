require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const passport = require('passport');
// const mongoose = require('mongoose');
const LocalStrategy = require('passport-local').Strategy;
// const Schema = mongoose.Schema;
const { SALT, SESSION_SECRET, SERVER_PORT } = process.env;
const options = { verbose: console.log };
const Database = require('better-sqlite3');

// ----------------------------------------------------------------

// connect to db
const db = new Database('./test.db', options);
//CREATE TABLE
// db.run(sql);

//DROP TABLE
// db.run('DROP TABLE users');

//INSERT DATA

// sql = 'INSERT INTO users (username, password) VALUES (?,?)';
// db.run(sql, ['testuser1', 'testpassword1'], (err) => {
// 	if (err) return console.error;
// });

//QUERY  DB

// ----------------------------------------------------------------

const app = express();
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/styles'));
app.use(
	session({
		secret: SESSION_SECRET,
		resave: false,
		saveUninitialized: true,
	})
);
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());

app.get('/', (req, res) => {
	console.log('test', req.error);
	res.render('index', { user: req.user, error: req.error });
});
app.get('/fail', (req, res) => {
	console.log('fail)');
	// res.send(' {failed: true} ');
});

app.get('/sign-up', (req, res) => {
	res.render('sign-up-form', { error: null });
});

app.post('/sign-up', async (req, res) => {
	try {
		const existingUser = await User.findOne({
			username: req.body.username,
		}).exec();

		if (existingUser !== null) {
			throw new Error('Username In Use');
		}
		if (req.body.password.length < 6) {
			throw new Error('Password Must Be At Least 6 characters');
		}
		if (req.body.password.length > 16) {
			throw new Error('Password Must Be Less Than 16 characters');
		}
		if (req.body.password == 'password') {
			throw new Error('Password cannot be password');
		}
		const saltedPassword = await hashedPassword(req.body.password);

		const user = new User({
			username: req.body.username,
			password: saltedPassword,
		}).save((err) => {
			if (err) {
				return err;
			}
			res.redirect('/');
		});
	} catch (error) {
		res.status(400).render('sign-up-form', { error: error });
	}
});

app.post(
	'/log-in',
	passport.authenticate('local', {
		successReturnToOrRedirect: '/',
		failureRedirect: '/fail',
		failureMessage: true,
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
	new LocalStrategy(async (username, password, done) => {
		try {
			const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
			const user = stmt.get(username);
			console.log('test2', user);
			if (!user) {
				return done({ message: 'incorrect Username' });
			}
			if (!comparePassword(user.password, password)) {
				return done({ message: 'incorrect Password' });
			}
			return done(null, user);
		} catch (error) {
			done(error);
		}
	})
);

passport.serializeUser(function (user, done) {
	done(null, user.username);
});

passport.deserializeUser(async (username, done) => {
	try {
		const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
		const user = stmt.get(username);
		if (!user) {
			done({ message: 'incorrect Username' });
		}
		return done(null, user);
	} catch (error) {
		done(error);
	}
});

const comparePassword = async (userPassword, requestedPassword) => {
	try {
		const isValid = await bcrypt.compare(requestedPassword, userPassword);
		return isValid;
	} catch (error) {
		console.log('error', error);
		throw new Error('error comparing password');
	}
};
const hashedPassword = async (password) => {
	try {
		const saltedPassword = await bcrypt.hash(SALT, 10);
		return saltedPassword;
	} catch (error) {
		console.error('error2', error);
		throw new Error('error hashing password');
	}
};

// -------------------------------

app.listen(process.env.SERVER_PORT, () =>
	console.log(`Server Listening On Port: ${SERVER_PORT}`)
);
