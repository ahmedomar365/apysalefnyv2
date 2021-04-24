const faker = require('faker');
const Post = require('./models/post');

async function seedsPosts() {
    await Post.remove({});
    for(const i of new Array(40)) {
        const post = {
            title: faker.lorem.word(),
            description: faker.lorem.text(),
            author:  {
                '_id': '60808f48ad36a92cac104d95',
                'username': 'elsayed'
            }
        }
        await Post.create(post);
    }
    console.log('40 new posts created!');
}

module.exports = seedsPosts;