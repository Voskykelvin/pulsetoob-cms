const { Article, Media, User } = require('./models');

async function run() {
  try {
    // 1. Find a real user in the database
    const user = await User.findOne();
    if (!user) {
      console.log('No user found in DB. Please create a user first.');
      process.exit(1);
    }
    console.log('Found user ID for test:', user.id);

    // 2. Create dummy Media (linked to the user)
    const media = await Media.create({
      filename: 'test-file',
      originalName: 'test.png',
      mimeType: 'image/png',
      type: 'image',
      size: 1000,
      url: 'http://example.com/test.png',
      uploadedById: user.id // FIXED: Link the media creator
    });
    console.log('Created dummy media with ID:', media.id);

    // 3. Create Article with that Media ID
    const article = await Article.create({
      title: 'Sequelize Direct Backend Test',
      slug: 'sequelize-direct-backend-test-' + Date.now().toString(36),
      content: '<p>Testing featured image save logic.</p>',
      authorId: user.id,
      featuredImageId: media.id // Passing the media ID directly!
    });
    console.log('Created article with ID:', article.id);
    console.log('Saved featuredImageId in DB:', article.featuredImageId);
    
    // 4. Clean up test records
    await article.destroy({ force: true });
    await media.destroy({ force: true });
    console.log('Test completed and cleanup successful.');
    process.exit(0);
  } catch (e) {
    console.error('Error during backend test:', e);
    process.exit(1);
  }
}
run();
