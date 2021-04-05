const mongose = require('mongoose');
const Shema = mongose.Schema;

const ReviewShema = new Shema({
    body: String,
    author: {
        type: Shema.Types.ObjectId,
        ref: 'User'
    },
});

module.exports = moongose.model('Review', ReviewShema);