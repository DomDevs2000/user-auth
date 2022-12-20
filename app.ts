//imports
import {Request, Response, NextFunction} from "express";
import * as dotenv from "dotenv";
import express from "express";
import path from 'path';
import {fileURLToPath} from "url";
import session from "express-session";
import passport from "passport";
import {Strategy as LocalStrategy} from "passport-local";
import Database from "better-sqlite3";
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const {SALT, SESSION_SECRET, SERVER_PORT} = process.env;

// types
type User = {
	username: string
	password: string
}

declare global {
	namespace Express {
		interface User {
			username: string;
			password: string;
		}
	}
}

declare module 'express-session' {
	interface SessionData {
		user: User;
		messages: string[];
	}
}

// connect to db
const db = new Database('users.db', {verbose: console.log});
db.exec(`CREATE TABLE IF NOT EXISTS users (username, password)`);

const app = express();
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/styles'));
app.use(
	session({
		secret: SESSION_SECRET!,
		resave: false,
		saveUninitialized: true,
	})
);

app.use(passport.session());
app.use(express.urlencoded({extended: false}));
app.use(passport.initialize());


app.get('/log-in', (req: Request, res: Response) => {
	let error = null;
	if (req.session && req.session.messages && req.session.messages.length > 0) {
		error = {message: req.session.messages[0]};
	}
	res.render('index', {
		user: req.user,
		error: error,
		signUpSuccessful: false,
	});
});

app.get('/', (req: Request, res: Response) => {
	res.render('sign-up-form', {error: null});
});

app.get('/welcome', (req: Request, res: Response) => {
	res.render('welcome', {user: req.user, error: null});
});

app.post('/', async (req: Request, res: Response) => {
	try {
		let username = req.body.username;
		let password = req.body.password;
		const hash = await bcrypt.hash(password, 10);
		console.log(hash);
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
				`INSERT INTO users (username, password) VALUES (@username,@hash)`
			)
			.run({username, hash});


		const newUser = db
			.prepare('SELECT * FROM users WHERE username = ?')
			.get(username);
		if (newUser) {
			res.render('index', {user: null, signUpSuccessful: true, error: null});
		}

	} catch (error) {
		res.status(400).render('sign-up-form', {error: error});
	}
});

app.post(
	'/log-in',
	passport.authenticate('local', {
		successRedirect: '/welcome',
		failureRedirect: '/log-in',
		failureMessage: true,
	})
);


app.get('/log-out', (req: Request, res: Response, next: NextFunction) => {
	req.logout(function (err) {
		if (err) {
			return next(err);
		}
		res.redirect('/');
	});
});

passport.use(
	new LocalStrategy(
		{passReqToCallback: true},
		async (req: Request, username: string, password: string, done: any) => {
			req.session.messages = [];
			try {
				const user = db
					.prepare('SELECT * FROM users WHERE username = ?')
					.get(username);
				if (user) {
					const checkPass = await bcrypt.compare(password, user.password);
					console.log(checkPass);
					if (!checkPass) {
						return done(null, false, {message: 'Incorrect Password'});
					} else {
						return done(null, user);
					}

				}
				if (!user) {
					return done(null, false, {message: 'Incorrect Username'});
				}

			} catch (error) {
				done(error);
			}
		}
	)
);

passport.serializeUser((user: User, done: any) => {
	done(null, user.username);
});
passport.deserializeUser(async (username: User, done: any) => {
	try {
		const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
		const user = stmt.get(username);
		if (!user) {
			done({message: 'Incorrect Username'});
		}
		return done(null, user);
	} catch (error) {
		done(error);
	}
});


app.listen(process.env.SERVER_PORT, () =>
	console.log(`Server Listening On Port: ${SERVER_PORT}`)
);
