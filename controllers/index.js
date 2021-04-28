const User = require('../models/user');
const Post = require('../models/post');
const passport = require('passport');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const util = require('util');
const { cloudinary } = require('../cloudinary');
const { deleteProfileImage } = require('../middleware');
const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
module.exports = {
    // GET / 
    async landingPage(req, res, next) {
        const posts = await Post.find({});
        res.status(200).send({ posts, mapBoxToken, title: 'Salefny - Home'});
    },
    // GET /register
    getRegister(req, res, next) {
        res.send({ title: 'Register', username: '', email: '' });
    },
    //POST /register
    async postRegister(req, res, next) {
        console.log('registering user');
        try {
            if (req.file) {
                const { path, filename } = req.file;
                // console.log(path);
                // console.log(req.file);

                req.body.image = {
                    path: path, filename: filename
                };
                // console.log(req.body.image);
            }
            const user = await User.register(new User(req.body), req.body.password);
            req.login(user, function(err) {
                if (err) {
                    res.send(err);
                    return next(err);
                }
                req.session.success = `Welcome, ${user.username}!`;
                res.send(req.session.success);
    
            });

        }catch(err) {
            deleteProfileImage(req);
            const { username, email } = req.body;
            let error = err.message;
            if (error.includes('duplicate') && error.includes('index: email_1 dup key')) {
                error = 'A user with the given email is already registered';
            }
            res.send({ title: 'Register', username, email, error });
        }

        
    },
    // GET /login
    getLogin(req, res, next) {
        if (req.isAuthenticated()) return res.send('user is already logged in');
        if (req.query.returnTo) req.session.redirectTo = req.headers.referer;
        res.status(200).send({ title: 'login' });
    },
    //POST /login
    async postLogin(req, res, next) {
        
        console.log('helo');

        const { username, password } = req.body;
        const { user, error } = await User.authenticate()(username, password);
        if (!user && error) {
            res.send(error);
            return next(error);

        }
        req.login(user, function(err) {
            if (err) return next(err);
            req.session.success = `Welcome back, ${username}!`;
            const redirectUrl = req.session.redirectTo || '/';
            delete req.session.redirectTo;
            // let userToClient = req.user.image;
            // var copy = Object.assign({}, req.user);
            var copy = req.user
            // delete userTOClient;
            // delete copy.salt;
            delete copy._doc.salt;
            delete copy._doc.hash;
            // console.log(copy);
            res.send({message: req.session.success, redirectUrl, session: req.sessionID, user: copy });
            // console.log(req.sessionID);
            console.log(req.sessionStore.sessions);
            // console.log(req.user);
        });
    },

    // GET /logout
    getLogout(req, res, next) {
        req.logout();
        res.send('logged out');
          
    },

    async getProfile(req, res, next) {
        const posts = await Post.find().where('author').equals(req.user._id).limit(10).exec();
        res.send({ posts });
    },
    async updateProfile(req, res, next) {
		// destructure username and email from req.body
		const {
			username,
			email
		} = req.body;
		// destructure user object from res.locals
		const { user } = res.locals;
		// check if username or email need to be updated
		if (username) user.username = username;
		if (email) user.email = email;
        if (req.file) {
            if (user.image.filename) await cloudinary.uploader.destroy(user.image.filename);
            const { path, filename } = req.file;
            user.image = { path, filename };
        }
		// save the updated user to the database
		await user.save();
		// promsify req.login
		const login = util.promisify(req.login.bind(req));
		// log the user back in with new info
		await login(user);
		// redirect to /profile with a success flash message
		req.session.success = 'Profile successfully updated!';
		res.send(req.session.success);
	},
    getForgotPw(req, res, next) {
        res.send('users/forgot');
    },
    async putForgotPw(req, res, next) {
        const token = await crypto.randomBytes(20).toString('hex');
        
        const user = await User.findOne({ email: req.body.email })
        if (!user) {
            req.session.error = 'No account with that email address exists.';
          return res.send(req.session.error);
        }
    
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    
      await user.save();
      
    
      const msg = {
        to: user.email,
        from: 'salefnyrent@gmail.com',
        subject: 'Surf Shop - Forgot Password / Reset',
        text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.
                Please click on the following link, or copy and paste it into your browser to complete the process:
                http://${req.headers.host}/reset/${token}
                If you did not request this, please ignore this email and your password will remain unchanged.`.replace(/				/g, ''),
      };
    
      await sgMail.send(msg);
    
      req.session.success = `An e-mail has been sent to ${user.email} with further instructions.`;
      res.send(req.session.success);
    },
    async getReset(req, res, next) {
      const { token } = req.params;
        const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } })
      if (!user) {
        req.session.error = 'Password reset token is invalid or has expired.';
        return res.status(400).send({
            message: 'Password reset token is invalid or has expired.'
         });
      }
      res.render('users/reset', { token });
    },
    async putReset(req, res, next) {
        const { token } = req.params;
        const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
        
        if (!user) {
         req.session.error = 'Password reset token is invalid or has expired.';
         return res.status(400).send({
            message: 'Password reset token is invalid or has expired.'
         });
        }
    
        if(req.body.password === req.body.confirm) {
            await user.setPassword(req.body.password);
            user.resetPasswordToken = null;
            user.resetPasswordExpires = null;
            await user.save();
            const login = util.promisify(req.login.bind(req));
            await login(user);
        } else {
            req.session.error = 'Passwords do not match.';
            // return res.redirect(`/reset/${ token }`);
            return res.status(400).send({
                message: 'Password reset token is invalid or has expired.'
             });
        }
    
      const msg = {
        to: user.email,
        from: 'salefnyrent@gmail.com',
        subject: 'Surf Shop - Password Changed',
        text: `Hello,
              This email is to confirm that the password for your account has just been changed.
              If you did not make this change, please hit reply and notify us at once.`.replace(/		  	/g, '')
      };
      
      await sgMail.send(msg);
    
      req.session.success = 'Password successfully updated!';
      res.send(req.session.success);
    }
}