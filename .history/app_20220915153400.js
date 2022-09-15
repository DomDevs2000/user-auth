const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Schema = mongoose.Schema;

// ----------------------------------------------------------------

app.listen(3000, () => console.log('Hello World'));
