const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const { default: mongoose } = require('mongoose');
const LocalStrategy = require('passport-local').Strategy;
const Schema = mongoose.Schema;
// ----------------------------------------------------------------
async function db() {
	await mongoose.connection('mongodb://localhost:27017/user-auth');
	console.log('Connected to MongoDB');
}
// ----------------------------------------------------------------

db().catch((err) => console.log(err));
app.listen(3000, () => console.log('Hello World'));
