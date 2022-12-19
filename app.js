var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
require('dotenv').config();
var express = require('express');
var bcrypt = require('bcryptjs');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var _a = process.env, SALT = _a.SALT, SESSION_SECRET = _a.SESSION_SECRET, SERVER_PORT = _a.SERVER_PORT;
var Database = require('better-sqlite3');
// ----------------------------------------------------------------
// connect to db
var db = new Database('users.db', { verbose: console.log });
db.exec("CREATE TABLE IF NOT EXISTS users (username, password)");
// ----------------------------------------------------------------
var app = express();
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/styles'));
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
app.get('/log-in', function (req, res) {
    var error = null;
    if (req.session && req.session.messages && req.session.messages.length > 0) {
        error = { message: req.session.messages[0] };
    }
    res.render('index', {
        user: req.user,
        error: error,
        signUpSuccessful: false
    });
});
app.get('/', function (req, res) {
    res.render('sign-up-form', { error: null });
});
app.get('/welcome', function (req, res) {
    res.render('welcome', { user: req.user, error: null });
});
app.post('/', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var username, password, user, results, newUser;
    return __generator(this, function (_a) {
        try {
            username = req.body.username;
            password = req.body.password;
            if (username.length < 6) {
                throw new Error('Password Must Be At Least 6 characters');
            }
            if (password.length > 16) {
                throw new Error('Password Must Be Less Than 16 characters');
            }
            if (password == 'password') {
                throw new Error('Password cannot be password');
            }
            user = db
                .prepare('SELECT * FROM users WHERE username = ?')
                .get(username);
            if (user) {
                throw new Error('Username In Use');
            }
            results = db
                .prepare("INSERT INTO users (username, password) VALUES (@username,@password)")
                .run({ username: username, password: password });
            newUser = db
                .prepare('SELECT * FROM users WHERE username = ?')
                .get(username);
            if (newUser) {
                res.render('index', { user: null, signUpSuccessful: true, error: null });
            }
            // const saltedPassword = await hashedPassword(req.body.password);
        }
        catch (error) {
            res.status(400).render('sign-up-form', { error: error });
        }
        return [2 /*return*/];
    });
}); });
app.post('/log-in', passport.authenticate('local', {
    successRedirect: '/welcome',
    failureRedirect: '/log-in',
    failureMessage: true
}));
app.get('/log-out', function (req, res, next) {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});
// ----------------------------------------------------------------
passport.use(new LocalStrategy({ passReqToCallback: true }, function (req, username, password, done) { return __awaiter(_this, void 0, void 0, function () {
    var user;
    return __generator(this, function (_a) {
        req.session.messages = [];
        try {
            user = db
                .prepare('SELECT * FROM users WHERE username = ?')
                .get(username);
            if (!user) {
                return [2 /*return*/, done(null, false, { message: 'Incorrect Username' })];
            }
            if (user.password != password) {
                return [2 /*return*/, done(null, false, { message: 'Incorrect Password' })];
            }
            return [2 /*return*/, done(null, user)];
        }
        catch (error) {
            done(error);
        }
        return [2 /*return*/];
    });
}); }));
passport.serializeUser(function (user, done) {
    done(null, user.username);
});
passport.deserializeUser(function (username, done) { return __awaiter(_this, void 0, void 0, function () {
    var stmt, user;
    return __generator(this, function (_a) {
        try {
            stmt = db.prepare('SELECT * FROM users WHERE username = ?');
            user = stmt.get(username);
            if (!user) {
                done({ message: 'incorrect Username' });
            }
            return [2 /*return*/, done(null, user)];
        }
        catch (error) {
            done(error);
        }
        return [2 /*return*/];
    });
}); });
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
app.listen(process.env.SERVER_PORT, function () {
    return console.log("Server Listening On Port: ".concat(SERVER_PORT));
});
