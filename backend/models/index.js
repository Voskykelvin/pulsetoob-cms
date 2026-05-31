const sequelize = require('../config/database');
const User = require('./User');
const Article = require('./Article');
const Category = require('./Category');
const Media = require('./Media');
const Backlink = require('./Backlink');
const Analytics = require('./Analytics');
const Comment = require('./Comment');
const Tag = require('./Tag');
const Advertisement = require('./Advertisement');
const Setting = require('./Setting');
const NewsletterSubscriber = require('./NewsletterSubscriber');
const ContactMessage = require('./ContactMessage');

// User <-> Article
User.hasMany(Article, { foreignKey: 'authorId', as: 'articles' });
Article.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

// Category <-> Article (Many-to-Many)
const ArticleCategory = sequelize.define('ArticleCategory', {}, { timestamps: false });
Article.belongsToMany(Category, { through: ArticleCategory, as: 'categories' });
Category.belongsToMany(Article, { through: ArticleCategory, as: 'articles' });

// Category hierarchy
Category.hasMany(Category, { foreignKey: 'parentId', as: 'subcategories' });
Category.belongsTo(Category, { foreignKey: 'parentId', as: 'parent' });

// Tag <-> Article (Many-to-Many)
const ArticleTag = sequelize.define('ArticleTag', {}, { timestamps: false });
Article.belongsToMany(Tag, { through: ArticleTag, as: 'tags' });
Tag.belongsToMany(Article, { through: ArticleTag, as: 'articles' });

// Media <-> User
User.hasMany(Media, { foreignKey: 'uploadedById', as: 'media' });
Media.belongsTo(User, { foreignKey: 'uploadedById', as: 'uploadedBy' });

// Article <-> Media
Article.belongsTo(Media, { foreignKey: 'featuredImageId', as: 'featuredImage' });

// Backlink <-> Article
Article.hasMany(Backlink, { foreignKey: 'articleId', as: 'backlinks' });
Backlink.belongsTo(Article, { foreignKey: 'articleId', as: 'article' });

// Analytics <-> Article
Article.hasMany(Analytics, { foreignKey: 'articleId', as: 'analytics' });
Analytics.belongsTo(Article, { foreignKey: 'articleId', as: 'article' });

// Comment <-> Article
Article.hasMany(Comment, { foreignKey: 'articleId', as: 'comments' });
Comment.belongsTo(Article, { foreignKey: 'articleId', as: 'article' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Nested comments
Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies' });
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parentComment' });

module.exports = {
  sequelize,
  User,
  Article,
  Category,
  Media,
  Backlink,
  Analytics,
  Comment,
  Tag,
  Advertisement,
  Setting,
  NewsletterSubscriber,
  ContactMessage,
  ArticleCategory,
  ArticleTag,
};
