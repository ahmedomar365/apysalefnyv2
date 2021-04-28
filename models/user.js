const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const Schema = mongoose.Schema;

const UserShema = new Schema({
    email: { type: String, unique: true, required: true },
    image: {
        path: { type: String, default: '/images/default-profile.jpg' },
        filename: String
    }

});

UserShema.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', UserShema);