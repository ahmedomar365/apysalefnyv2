const mongoose = require('mongoose');
const Schema = mongose.Schema;

const ReviewShema = new Schema({
    body: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
});

module.exports = mongoose.model('Review', ReviewShema);