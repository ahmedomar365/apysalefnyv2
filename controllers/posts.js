const Post = require('../models/post');
const cloudinary = require('cloudinary');

cloudinary.config({
    cloud_name: 'dpxkjv3fg',
    api_key: '311534663183965',
    api_secret: process.env.CLOUDINARY_SECRET
});

module.exports = {

    //get post index from database
    async postIndex(req, res, next) {
        let posts = await Post.find({});
        res.render('posts/index', { posts });
    },

    //creating a new post
    postNew(req, res, next) {
        res.render('posts/new');
    },

    //Posts Create
    async postCreate(req, res, next) {
        req.body.post.images = [];
        for(const file of req.files) {
            let image = await cloudinary.v2.uploader.upload(file.path);
            req.body.post.images.push({
                url: image.secure_url,
                public_id: image.public_id
            });

        }
        //use req.body to create a new Post
        let post = await Post.create(req.body.post)
        res.redirect(`/posts/${post.id}`);

    },

    //Posts Show
    async postShow(req, res, next) {
        let post = await Post.findById(req.params.id);
        res.render('posts/show', { post });

    },

    //Posts Edit    

    async postEdit(req, res, next) {
        let post = await Post.findById(req.params.id);
        res.render('posts/edit', { post });

    },

    // Posts Update
    async postUpdate(req, res, next) {

        let post = await Post.findById(req.params.id);
        if (req.body.deleteImages && req.body.deleteImages.length) {
            let deleteImages = req.body.deleteImages;
            for (const public_id of deleteImages) {
                await cloudinary.v2.uploader.destroy(public_id);
                for (const image of post.images) {
                    if (image.public_id === public_id) {
                        let index = post.images.indexOf(image);
                        post.images.splice(index, 1);
                    }
                }
            }
        }
        if (req.files) {
            for(const file of req.files) {
                let image = await cloudinary.v2.uploader.upload(file.path);
                post.images.push({
                    url: image.secure_url,
                    public_id: image.public_id
                });
    
            }
        }

        post.title = req.body.post.title;
        post.description = req.body.post.description;
        post.price = req.body.post.price;
        post.location = req.body.post.location;
        post.save();
        res.redirect(`/posts/${post.id}`);

    },
    
    async postDestroy(req, res, next) {
        let post = await Post.findById(req.params.id);
        for (const image of post.images) {
            await cloudinary.v2.uploader.destroy(image.public_id);
            
        }
        await post.remove()
        res.redirect('/posts');
    }
}