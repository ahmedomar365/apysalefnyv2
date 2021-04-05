const mongose = require('mongoose');
const Shema = mongose.Schema;

const PostShema = new Shema({
    title: String,
    price: String,//Post profile image
    description: String,
    images: [Stirng],
    location: Stirng,
    lat: Number,
    lng: Number,
    author: {
        type: Shema.Types.ObjectId,
        ref: 'User'
    },

    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]

});

module.exports = moongose.model('Post', PostShema);