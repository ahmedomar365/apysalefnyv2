const express = require('express');
const router = express.Router();
const multer = require('multer');
// const upload = multer({'dest': 'uploads/'});
const { cloudinary, storage } = require('../cloudinary');
const upload = multer({ storage });
const { asyncErrorHandler, isLoggedIn } =  require('../middleware');
const { 
    postIndex, 
    postNew, 
    postCreate,
    postShow,
    postEdit,
    postUpdate,
    postDestroy
} = require('../controllers/posts');

/* GET posts index /posts */
router.get('/', asyncErrorHandler(postIndex));

/* GET posts new /posts/new */
router.get('/new', isLoggedIn, (postNew));

/* POST posts create /posts */
router.post('/', isLoggedIn, upload.array('images', 4), asyncErrorHandler(postCreate)); //we use asyncErrorHandler because it's an async function

/* GET posts show /posts/:id */
router.get('/:id', asyncErrorHandler(postShow));

/* GET posts edit /posts/:id/edit */
router.get('/:id/edit', asyncErrorHandler(postEdit));

/* PUT posts update /posts/:id/ */
router.put('/:id', upload.array('images', 4), asyncErrorHandler(postUpdate));

/* DELETE posts destory /posts/:id */
router.delete('/:id', asyncErrorHandler(postDestroy));
  
module.exports = router;
  
  