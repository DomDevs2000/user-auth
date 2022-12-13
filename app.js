require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { SALT, SESSION_SECRET, SERVER_PORT } = process.env;
const options = { verbose: console.log };
const Database = require('better-sqlite3');

// ----------------------------------------------------------------
// connect to db
const db = new Database('./test.db', options)
db.exec(`CREATE TABLE IF NOT EXISTS users ( id INTEGER PRIMARY KEY AUTOINCREMENT)`)
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
	let error = null;

	if (req.session && req.session.messages && req.session.messages.length > 0) {
		error = { message: req.session.messages[0] };
	}
	res.render('index', {
		user: req.user,
		error: error,
		signUpSuccessful: false,
	});
});

app.get('/sign-up', (req, res) => {
	res.render('sign-up-form', { error: null });
});

app.post('/sign-up', async (req, res) => {
	try {
		let username = req.body.username;
		let password = req.body.password;
		if (username.length < 6) {
			throw new Error('Password Must Be At Least 6 characters');
		}
		if (password.length > 16) {
			throw new Error('Password Must Be Less Than 16 characters');
		}
		if (password == 'password') {
			throw new Error('Password cannot be password');
		}

		const user = db
			.prepare('SELECT * FROM users WHERE username = ?')
			.get(username);

		if (user) {
			throw new Error('Username In Use');
		}

		const results = db
			.prepare(
				`INSERT INTO users (username, password) VALUES (@username,@password)`
			)
			.run({ username, password });

		const newUser = db
			.prepare('SELECT * FROM users WHERE username = ?')
			.get(username);
		if (newUser) {
			res.render('index', { user: null, signUpSuccessful: true , error: null});
		}
		// const saltedPassword = await hashedPassword(req.body.password);
	} catch (error) {
		res.status(400).render('sign-up-form', { error: error });
	}
});

app.post(
	'/log-in',
	passport.authenticate('local', {
		successRedirect: '/',
		failureRedirect: '/',
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
	new LocalStrategy(
		{ passReqToCallback: true },
		async (req, username, password, done) => {
			req.session.messages = [];
			try {
				const user =  db
					.prepare('SELECT * FROM users WHERE username = ?')
					.get(username);
				if (!user) {
					return done(null, false, { message: 'Incorrect Username' });
				}
				if (user.password != password) {
					return done(null, false, { message: 'Incorrect Password' });
				}
				return done(null, user);
			} catch (error) {
				done(error);
			}
		}
	)
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

// const comparePassword = async (userPassword, requestedPassword) => {
// 	try {
// 		const isValid = await bcrypt.compare(requestedPassword, userPassword);
// 		return isValid;
// 	} catch (error) {
// 		console.log('error', error);
// 		throw new Error('error comparing password');
// 	}
// };
// const hashedPassword = async (password) => {
// 	try {
// 		const saltedPassword = await bcrypt.hash(SALT, 10);
// 		return saltedPassword;
// 	} catch (error) {
// 		console.error('error2', error);
// 		throw new Error('error hashing password');
// 	}
// };

// -------------------------------

app.listen(process.env.SERVER_PORT, () =>
	console.log(`Server Listening On Port: ${SERVER_PORT}`)
);
