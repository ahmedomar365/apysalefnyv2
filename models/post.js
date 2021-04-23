const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review');
const PostShema = new Schema({
    title: String,
    price: String,//Post profile image
    description: String,
    images: [ { url: String, public_id: String } ],
    location: String,
    coordinates: Array,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },

    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]

});

PostShema.pre('remove', async function() {
    await Review.remove({
        _id: {
            $in: this.reviews
        }
    });
});

module.exports = mongoose.model('Post', PostShema);