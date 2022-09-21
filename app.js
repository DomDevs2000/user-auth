require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const passport = require('passport');
const mongoose = require('mongoose');
const LocalStrategy = require('passport-local').Strategy;
const Schema = mongoose.Schema;
const { SALT, SESSION_SECRET, SERVER_PORT } = process.env;

// ----------------------------------------------------------------
async function database() {
	await mongoose.connect(process.env.DB_URL);
	console.log('Connected to MongoDB');
}

// create mongoose model
const User = mongoose.model(
	'User',
	new Schema({
		username: {
			type: String,
			required: true,
			unique: true,
		},
		password: {
			type: String,
			required: true,
			unique: true,
		},
	})
);
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
	res.render('index', { user: req.user });
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
			if (!comparePassword(user.password, password)) {
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

const comparePassword = async (userPassword, requestedPassword) => {
	try {
		const isValid = await bcrypt.compare(requestedPassword, userPassword);
		return isValid;
	} catch (error) {
		console.log(error);
		throw new Error('error comparing password');
	}
};
const hashedPassword = async (password) => {
	try {
		const saltedPassword = await bcrypt.hash(SALT, 10);
		return saltedPassword;
	} catch (error) {
		console.error(error);
		throw new Error('error hashing password');
	}
};

// -------------------------------

database().then(async (connection) => {
	try {
		app.listen(process.env.SERVER_PORT, () =>
			console.log(`Server Listening On Port: ${SERVER_PORT}`)
		);
	} catch (error) {
		console.error(error);
	}
});
