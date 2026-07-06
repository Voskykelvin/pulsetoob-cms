const sanitizeHtml = require('sanitize-html');
const { Op } = require('sequelize');
const { Article, ContactMessage, NewsletterSubscriber, User } = require('../models');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const CONTACT_EMAIL = 'kelvinvosky2@gmail.com';
const PUBLIC_AUTHOR_ROLES = ['super_admin', 'admin', 'editor', 'author', 'contributor'];

function cleanText(value) {
  return sanitizeHtml(String(value || ''), { allowedTags: [], allowedAttributes: {} }).trim();
}

function getPublicSocialLinks(socialLinks = {}) {
  return Object.fromEntries(
    Object.entries(socialLinks || {}).filter(([, value]) => typeof value === 'string' && value.trim())
  );
}

class PublicController {
  async getAuthor(req, res) {
    try {
      const author = await User.findOne({
        where: {
          id: req.params.id,
          isActive: true,
          role: { [Op.in]: PUBLIC_AUTHOR_ROLES },
        },
        attributes: ['id', 'username', 'firstName', 'lastName', 'avatar', 'bio', 'socialLinks', 'createdAt', 'updatedAt'],
      });

      if (!author) return sendError(res, { status: 404, message: 'Author not found' });

      const [publishedArticleCount, latestArticle] = await Promise.all([
        Article.count({ where: { authorId: author.id, status: 'published' } }),
        Article.findOne({
          where: { authorId: author.id, status: 'published' },
          attributes: ['publishedAt', 'createdAt'],
          order: [['publishedAt', 'DESC'], ['createdAt', 'DESC']],
        }),
      ]);

      return sendSuccess(res, {
        data: {
          id: author.id,
          username: author.username,
          firstName: author.firstName,
          lastName: author.lastName,
          avatar: author.avatar,
          bio: author.bio,
          socialLinks: getPublicSocialLinks(author.socialLinks),
          publishedArticleCount,
          latestArticleAt: latestArticle?.publishedAt || latestArticle?.createdAt || null,
          createdAt: author.createdAt,
          updatedAt: author.updatedAt,
        },
      });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Could not load author profile' });
    }
  }

  async subscribe(req, res) {
    try {
      const email = cleanText(req.body.email).toLowerCase();
      const source = cleanText(req.body.source || 'homepage').slice(0, 120);

      const [subscriber, created] = await NewsletterSubscriber.findOrCreate({
        where: { email },
        defaults: {
          email,
          source,
          metadata: {
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          },
        },
      });

      if (!created && subscriber.status !== 'active') {
        await subscriber.update({ status: 'active', source });
      }

      return sendSuccess(res, {
        status: created ? 201 : 200,
        data: { email },
        message: created
          ? 'You are on the PulseToob list.'
          : 'You are already on the PulseToob list.',
      });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Could not save newsletter signup' });
    }
  }

  async contact(req, res) {
    try {
      const message = await ContactMessage.create({
        name: cleanText(req.body.name).slice(0, 160),
        email: cleanText(req.body.email).toLowerCase().slice(0, 320),
        topic: req.body.topic,
        subject: cleanText(req.body.subject).slice(0, 180),
        message: cleanText(req.body.message).slice(0, 5000),
        consent: req.body.consent === true,
        metadata: {
          contactEmail: CONTACT_EMAIL,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      return sendSuccess(res, {
        status: 201,
        data: { id: message.id, contactEmail: CONTACT_EMAIL },
        message: 'Message received. Thanks for reaching out to PulseToob.',
      });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Could not send contact message' });
    }
  }
}

module.exports = new PublicController();
