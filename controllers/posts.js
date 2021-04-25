const Post = require('../models/post');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapBoxToken });
const { cloudinary } = require('../cloudinary');

module.exports = {

    //get post index from database
    async postIndex(req, res, next) {
        let posts = await Post.paginate({}, {
            page: req.query.page || 1,
            limit: 10,
            sort: '-_id'
        });
        posts.page = Number(posts.page);
        res.render('posts/index', { posts, mapBoxToken: mapBoxToken ,title: 'Posts Index' });
    },

    //creating a new post
    postNew(req, res, next) {
        
        res.render('posts/new');
    },

    //Posts Create
    async postCreate(req, res, next) {
        req.body.post.images = [];
        for(const file of req.files) {
            req.body.post.images.push({
                path: file.path,
                filename: file.filename
            });

        }
        let response = await geocodingClient.forwardGeocode({
            query: req.body.post.location,
            limit: 1,
          })
            .send();
        req.body.post.geometry = response.body.features[0].geometry;
        req.body.post.author = req.user._id;
        //use req.body to create a new Post
        // let post = await Post.create(req.body.post)
        let post = new Post(req.body.post);
		post.properties.description = `<strong><a href="/posts/${post._id}">${post.title}</a></strong><p>${post.location}</p><p>${post.description.substring(0, 20)}...</p>`;
		await post.save();

        req.session.success = 'Post created successfully!';
        res.redirect(`/posts/${post.id}`);

    },

    //Posts Show
    async postShow(req, res, next) {
        let post = await Post.findById(req.params.id).populate({
            path: 'reviews',
            options: { sort: { '_id': -1 } },
            populate: {
                path: 'author',
                model: 'User'
            }
        });
        const floorRating = post.calculateAvgRating();
        res.render('posts/show', { post, floorRating });

    },

    //Posts Edit    

    async postEdit(req, res, next) {
        
        res.render('posts/edit');

    },

    // Posts Update
    async postUpdate(req, res, next) {

        const { post } = res.locals;
        if (req.body.deleteImages && req.body.deleteImages.length) {
            let deleteImages = req.body.deleteImages;
            for (const filename of deleteImages) {
                await cloudinary.uploader.destroy(filename);
                for (const image of post.images) {
                    if (image.filename === filename) {
                        let index = post.images.indexOf(image);
                        post.images.splice(index, 1);
                    }
                }
            }
        }
        if (req.files) {
            for(const file of req.files) {
                post.images.push({
                    path: file.path,
                    filename: file.filename
                });
    
            }
        }

        // check if location was updated
        if (req.body.post.location !== post.location) {
            let response = await geocodingClient.forwardGeocode({
                query: req.body.post.location,
                limit: 1,
              })
                .send();
                post.geometry = response.body.features[0].geometry;
                post.location = req.body.post.location;
        }


        post.title = req.body.post.title;
        post.description = req.body.post.description;
        post.price = req.body.post.price;
		post.properties.description = `<strong><a href="/posts/${post._id}">${post.title}</a></strong><p>${post.location}</p><p>${post.description.substring(0, 20)}...</p>`;

        post.save();
        res.redirect(`/posts/${post.id}`);

    },
    
    async postDestroy(req, res, next) {
        const { post } = res.locals;
        for (const image of post.images) {
            await cloudinary.uploader.destroy(image.filename);
            
        }
        await post.remove()
        req.session.success = 'Post deleted successfully!';
        res.redirect('/posts');
    }
}