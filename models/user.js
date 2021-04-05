const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const Schema = mongoose.Schema;

const UserShema = new Schema({
    email: String,
    image: String,//user profile image
    posts: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Post'
        }
    ]

});

UserShema.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', UserShema);