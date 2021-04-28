const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const Schema = mongoose.Schema;

const UserShema = new Schema({
    uid: String,//profile id
    token: String,
    gender: String,
    salt: { type: String, select: false },
    hash: { type: String, select: false },
    first_name: String, 
    last_name: String, 
    email: { type: String, unique: true, required: true },
    national_id: { type: String, unique: true, required: true }, 
    phone_number: String, 
    city: String, 
    covernate: String, 
    address: String, 
    job_description: String, 

    
    image: {
        path: { type: String, default: '/images/default-profile.jpg' },
        filename: String
    },
    resetPasswordToken: String,
	resetPasswordExpires: Date

});

UserShema.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', UserShema);