require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const engine = require('ejs-mate');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const passport = require('passport');
const facebookStrategy = require('passport-facebook').Strategy
const User = require('./models/user');
const session = require('express-session');
const logger = require('morgan');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const cors = require("cors");
const MongoStore = require('connect-mongo');



// const seedPost = require('./seeds');
// seedPost();
// const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://surf:surf@cluster0.hufxf.mongodb.net/salefny-v2?retryWrites=true&w=majority";
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// require routes
const indexRouter = require('./routes/index');
const postsRouter = require('./routes/posts');
const reviewsRouter = require('./routes/reviews');
const user = require('./models/user');
const app = express();
// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "http://localhost:8080/");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   res.header('Access-Control-Allow-Credentials', true);
//   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
//   next();
// });
app.use(cors({credentials: true, origin: 'http://localhost:8080'}));

//connect to the database
// mongoose.connect('mongodb+srv://<username>:<password>@cluster0.hufxf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority');
mongoose.connect(uri,  { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('we are connected!');
}); 

// const sessionStore = new MongoStore({
//   mongooseConnection: db,
//   collection: 'sessions',
// });

// client.connect(err => {
//   const collection = client.db("surf-shop").collection("user");
//   // perform actions on the collection object
//   client.close();
// });

// use ejs-locals for all ejs templates:
app.engine('ejs', engine);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//setup public assets directory
app.use(express.static('public'));

app.use(logger('dev'));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));


//configure Passport and Sessions

app.use(session({
  secret: 'hang te!@#!#dawdn dudwadadadawdadde!',
  resave: false,
  saveUninitialized: true,
//   store: MongoStore.create({
//     mongoUrl: uri,
//     touchAfter: 24 * 3600, // time period in seconds
// }),

}));

app.use(passport.initialize());
app.use(passport.session());

// passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
//facebook strategy
passport.use(new facebookStrategy({

  // pull in our app id and secret from our auth.js file
  clientID        : "488755738982896",
  clientSecret    : "5b8631b38223d705902e51629fde85fd",
  callbackURL     : "http://localhost:3000/facebook/callback",
  profileFields   : ['id','displayName','name','picture.type(large)','email']

},// facebook will send back the token and profile
async function(token, refreshToken, profile, done) {
  let user = await User.findOne({'uid': profile.id});
  //if there is an error stop everything and return that error
  if (err) return done(err);
  // if user if found log in them
  if (user) {
    console.log("user found");
    console.log("user");
    return done(null, user); // user found, return that user
  }else {
    // if there is no user found with that facebook id, create them
    let newUser = new User();
    // set all of the facebook information in our user model
    newUser.uid    = profile.id; // set the users facebook id                   
    newUser.token = token; // we will save the token that facebook provides to the user                    
    newUser.name  = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
    newUser.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first
    newUser.gender = profile.gender;
    newUser.pic = profile.photos[0].value;
    // save our user to the database
    await newUser.save();
    return done(null, newUser);
  }

  // console.log(profile)
  // return done(null,profile)
}));

passport.serializeUser((user, done) => {

  return done(null, user._id);

});

passport.deserializeUser((id, done) => {

  User.findById(id, (err, user) => {
      if (!err) {
          return done(null, user);
      } else {
          return done(err, null);
      }
  });

});
app.get('/profile', isLoggedIn,(req,res) => {
  console.log('hellooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo');
  console.log(req.sessionID);
  res.render("profile");
})
app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email,user_photos' }));
app.get('/facebook/callback',
		passport.authenticate('facebook', {
			successRedirect : '/profile',
			failureRedirect : '/'
		}));
app.get('/',(req,res) => {
  res.render("index")
})
/////////////////////////////////////////////////////////

// set local variables middleware
app.use(function(req, res, next) {
  console.log(user)

  // set default page title
  res.locals.title = 'salefny Shop';
  // req.user = {
  //   '_id': '60838c171e900715648eb580',
  //   'username': 'ian3'
  // }
  // res.locals.currentUser = req.user;
  // set success flash message
  res.locals.success = req.session.success || '';
  delete req.session.success;

  // set error flash message
  res.locals.error = req.session.error || '';
  delete req.session.error;
  // continue on to next function in middleware chains
  next();
});

//mountRoutes
app.use('/', indexRouter);
app.use('/posts', postsRouter);
app.use('/posts/:id/reviews', reviewsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
  // const err = new Error('Not Found');
  // err.status = 404;
  // next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // // set locals, only providing error in development
  // res.locals.message = err.message;
  // res.locals.error = req.app.get('env') === 'development' ? err : {};

  // // render the error page
  // res.status(err.status || 500);
  // res.render('error');
  console.log(err);
  req.session.error = err.message;
  res.redirect('back');

});


module.exports = app;
