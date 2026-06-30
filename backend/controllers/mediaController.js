const cloudinary = require('../config/cloudinary');
const { Media, User } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const IMAGE_TRANSFORMATIONS = {
  thumbnailSmall: 'c_fill,g_auto,w_320,h_180,f_auto,q_auto',
  thumbnailMedium: 'c_fill,g_auto,w_640,h_360,f_auto,q_auto',
  thumbnailLarge: 'c_fill,g_auto,w_1200,h_675,f_auto,q_auto',
  optimized: 'f_auto,q_auto',
};

const buildCloudinaryVariants = (secureUrl) => {
  if (!secureUrl || !secureUrl.includes('/upload/')) return {};

  return Object.fromEntries(
    Object.entries(IMAGE_TRANSFORMATIONS).map(([key, transform]) => [
      key,
      secureUrl.replace('/upload/', `/upload/${transform}/`),
    ])
  );
};

const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((tag) => String(tag).trim()).filter(Boolean);
  return String(tags).split(',').map((tag) => tag.trim()).filter(Boolean);
};

const hasUsefulAltText = (altText) => Boolean(altText && altText.trim().length >= 5);

class MediaController {
  async uploadImage(req, res) {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'Invalid image type' });
      }

      const publicId = `pulsetoob/images/${uuidv4()}`;

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            public_id: publicId,
            folder: 'pulsetoob/images',
            resource_type: 'image',
            quality: 'auto',
            fetch_format: 'auto',
          },
          (error, result) => { if (error) reject(error); else resolve(result); }
        );
        stream.end(req.file.buffer);
      });
      const variants = buildCloudinaryVariants(result.secure_url);
      const altText = req.body.altText || '';

      const media = await Media.create({
        filename: result.public_id, originalName: req.file.originalname,
        mimeType: req.file.mimetype, type: 'image',
        size: result.bytes, width: result.width, height: result.height,
        url: result.secure_url, secureUrl: result.secure_url,
        thumbnailUrl: variants.thumbnailMedium || result.secure_url,
        thumbnailSmall: variants.thumbnailSmall,
        thumbnailMedium: variants.thumbnailMedium,
        thumbnailLarge: variants.thumbnailLarge,
        variants,
        altText, caption: req.body.caption || '',
        title: req.body.title || req.file.originalname.replace(/\.[^.]+$/, ''),
        storage: 'cloudinary', storageId: result.public_id,
        folder: req.body.folder || 'images',
        collection: req.body.collection || null,
        focalPointX: req.body.focalPointX !== undefined ? Number(req.body.focalPointX) : 0.5,
        focalPointY: req.body.focalPointY !== undefined ? Number(req.body.focalPointY) : 0.5,
        needsAltText: !hasUsefulAltText(altText),
        tags: parseTags(req.body.tags),
        optimized: true,
        uploadedById: req.userId,
      });

      return sendSuccess(res, { status: 201, data: media, message: 'Image uploaded successfully' });
    } catch (error) {
      console.error('Image upload error:', error);
      return sendError(res, { status: 500, message: 'Failed to upload image' });
    }
  }

  async uploadVideo(req, res) {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      const publicId = `pulsetoob/videos/${uuidv4()}`;

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { public_id: publicId, folder: 'pulsetoob/videos', resource_type: 'video' },
          (error, result) => { if (error) reject(error); else resolve(result); }
        );
        stream.end(req.file.buffer);
      });

      const media = await Media.create({
        filename: result.public_id, originalName: req.file.originalname,
        mimeType: req.file.mimetype, type: 'video',
        size: result.bytes, width: result.width, height: result.height,
        duration: result.duration, url: result.secure_url, secureUrl: result.secure_url,
        altText: req.body.altText || '', title: req.body.title || req.file.originalname.replace(/\.[^.]+$/, ''),
        storage: 'cloudinary', storageId: result.public_id, folder: 'videos',
        uploadedById: req.userId,
      });

      return sendSuccess(res, { status: 201, data: media, message: 'Video uploaded successfully' });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to upload video' });
    }
  }

  async batchUpload(req, res) {
    try {
      if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

      const results = [];
      for (const file of req.files) {
        try {
          const isVideo = file.mimetype.startsWith('video/');
          const isImage = file.mimetype.startsWith('image/');
          if (!isVideo && !isImage) continue;

          const defaultFolder = isVideo ? 'videos' : 'images';
          const mediaFolder = req.body.folder ? String(req.body.folder).trim() || defaultFolder : defaultFolder;
          const publicId = `pulsetoob/${defaultFolder}/${uuidv4()}`;

          const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                public_id: publicId,
                folder: `pulsetoob/${defaultFolder}`,
                resource_type: isVideo ? 'video' : 'image',
                quality: isImage ? 'auto' : undefined,
                fetch_format: isImage ? 'auto' : undefined,
              },
              (error, result) => { if (error) reject(error); else resolve(result); }
            );
            stream.end(file.buffer);
          });

          const variants = isImage ? buildCloudinaryVariants(result.secure_url) : {};

          const media = await Media.create({
            filename: result.public_id, originalName: file.originalname,
            mimeType: file.mimetype, type: isVideo ? 'video' : 'image',
            size: result.bytes, width: result.width, height: result.height,
            duration: result.duration,
            url: result.secure_url, secureUrl: result.secure_url,
            thumbnailUrl: variants.thumbnailMedium || null,
            thumbnailSmall: variants.thumbnailSmall,
            thumbnailMedium: variants.thumbnailMedium,
            thumbnailLarge: variants.thumbnailLarge,
            variants,
            title: file.originalname.replace(/\.[^.]+$/, ''),
            altText: '',
            storage: 'cloudinary', storageId: result.public_id,
            folder: mediaFolder,
            needsAltText: isImage,
            optimized: isImage,
            uploadedById: req.userId,
          });

          results.push(media);
        } catch (e) { console.error('File upload failed:', e.message); }
      }

      return sendSuccess(res, { status: 201, data: results, message: `${results.length} file(s) uploaded` });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Batch upload failed' });
    }
  }

  async getAll(req, res) {
    try {
      const { page = 1, limit = 24, type, search, folder, collection, unused, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
      const pageNumber = parseInt(page, 10);
      const pageSize = parseInt(limit, 10);
      const offset = (pageNumber - 1) * pageSize;
      const where = {};
      if (type) where.type = type;
      if (folder) where.folder = folder;
      if (collection) where.collection = collection;
      if (unused === 'true') where.usageCount = 0;
      if (search) {
        where[Op.or] = [
          { originalName: { [Op.iLike]: `%${search}%` } },
          { title: { [Op.iLike]: `%${search}%` } },
          { altText: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows } = await Media.findAndCountAll({
        where, limit: pageSize, offset,
        order: [[sortBy, sortOrder]],
        include: [{ model: User, as: 'uploadedBy', attributes: ['id', 'username', 'avatar'] }],
      });

      return sendSuccess(res, {
        data: rows,
        pagination: {
          total: count,
          page: pageNumber,
          limit: pageSize,
          pages: Math.ceil(count / pageSize),
          hasNext: offset + pageSize < count,
          hasPrev: pageNumber > 1,
        },
      });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to fetch media' });
    }
  }

  async getOne(req, res) {
    try {
      const media = await Media.findByPk(req.params.id, { include: [{ model: User, as: 'uploadedBy', attributes: ['id', 'username'] }] });
      if (!media) return sendError(res, { status: 404, message: 'Media not found' });
      return sendSuccess(res, { data: media });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to fetch media' });
    }
  }

  async update(req, res) {
    try {
      const media = await Media.findByPk(req.params.id);
      if (!media) return sendError(res, { status: 404, message: 'Media not found' });

      const allowedUpdates = ['altText', 'caption', 'title', 'description', 'tags', 'folder', 'collection', 'focalPointX', 'focalPointY'];
      const updates = {};
      allowedUpdates.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });
      if (updates.tags !== undefined) updates.tags = parseTags(updates.tags);
      if (updates.altText !== undefined) updates.needsAltText = media.type === 'image' && !hasUsefulAltText(updates.altText);

      await media.update(updates);
      return sendSuccess(res, { data: media, message: 'Media updated successfully' });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to update media' });
    }
  }

  async delete(req, res) {
    try {
      const media = await Media.findByPk(req.params.id);
      if (!media) return sendError(res, { status: 404, message: 'Media not found' });
      if (media.usageCount > 0) return sendError(res, { status: 400, message: `Media is used in ${media.usageCount} article(s)` });

      const resourceType = media.type === 'video' ? 'video' : 'image';
      await cloudinary.uploader.destroy(media.storageId || media.filename, { resource_type: resourceType });
      await media.destroy();
      return sendSuccess(res, { message: 'Media deleted successfully' });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Failed to delete media' });
    }
  }

  async bulkDelete(req, res) {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids)) return sendError(res, { status: 400, message: 'Media IDs required' });

      const media = await Media.findAll({ where: { id: ids, usageCount: 0 } });
      for (const item of media) {
        const resourceType = item.type === 'video' ? 'video' : 'image';
        try { await cloudinary.uploader.destroy(item.storageId || item.filename, { resource_type: resourceType }); } catch (e) {}
      }

      const deleted = await Media.destroy({ where: { id: media.map(m => m.id) } });
      return sendSuccess(res, { message: `${deleted} media file(s) deleted` });
    } catch (error) {
      return sendError(res, { status: 500, message: 'Bulk delete failed' });
    }
  }
}

module.exports = new MediaController();
