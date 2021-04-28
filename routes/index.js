const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });
const { 
  getRegister,
  postRegister, 
  getLogin,
  postLogin, 
  getLogout, 
  landingPage,
  getProfile,
  updateProfile,
  getForgotPw,
  putForgotPw,
  getReset,
  putReset

} = require('../controllers');

const { 
  asyncErrorHandler, 
  isLoggedIn,
  isValidPassword,
  changePassword,

} = require('../middleware');

/* GET home/landing page. */
router.get('/', asyncErrorHandler(landingPage));

/* GET /register. */
router.get('/register', getRegister);
/* POST /register. */
//this is for creating the user.

router.post('/register', upload.single('image'), asyncErrorHandler(postRegister));

/* get /login. */
router.get('/login', getLogin);

// /* POST /login. */
// router.post('/login', passport.authenticate('local'), (req, res, next) => {
//   res.send("post /login");
// });
router.post('/login', asyncErrorHandler(postLogin));
/* GET /profile */

/* get /logout. */
router.get('/logout', getLogout);

router.get('/profile', isLoggedIn, asyncErrorHandler(getProfile));

//so that you can update the user info which you got from the login
//so the profile will get this data and then you will be able to update this information
/* PUT /profile*/
router.put('/profile',
 isLoggedIn,
  upload.single('image'),
  asyncErrorHandler(isValidPassword),
  asyncErrorHandler(changePassword),
  asyncErrorHandler(updateProfile)

  );

/* GET /forgot */
router.get('/forgot-password', getForgotPw);

/* PUT /forgot */
router.put('/forgot-password', asyncErrorHandler(putForgotPw));

/* GET /reset/:token */
router.get('/reset/:token', asyncErrorHandler(getReset));
/* PUT /reset/:token */
router.put('/reset/:token', asyncErrorHandler(putReset));
module.exports = router;
