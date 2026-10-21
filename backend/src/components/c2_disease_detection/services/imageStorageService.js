const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ValidationError, NotFoundError } = require('../../../shared/errors/AppError');
const { logger } = require('../../../shared/utils/logger');
const { env } = require('../../../config/env');

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

/**
 * Service for secure plant disease image storage and artifact management.
 * Enforces magic-byte file validation, unique key generation, and strict path-traversal prevention.
 */
class ImageStorageService {
  constructor() {
    this.storageRoot = env.C2_STORAGE_PATH
      ? path.resolve(env.C2_STORAGE_PATH)
      : path.resolve(__dirname, '../../../../uploads/c2_diseases');

    this.originalDir = path.join(this.storageRoot, 'original');
    this.gradCamDir = path.join(this.storageRoot, 'gradcam');

    this._ensureDirectories();
  }

  _ensureDirectories() {
    if (!fs.existsSync(this.originalDir)) {
      fs.mkdirSync(this.originalDir, { recursive: true });
    }
    if (!fs.existsSync(this.gradCamDir)) {
      fs.mkdirSync(this.gradCamDir, { recursive: true });
    }
  }

  /**
   * Validate image buffer format via magic bytes
   * @param {Buffer} buffer
   * @returns {string} extension ('jpg', 'png', 'webp')
   */
  validateImageBuffer(buffer) {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new ValidationError('Invalid image: File buffer is empty or missing');
    }

    if (buffer.length < 16) {
      throw new ValidationError('Invalid image: File size is too small to be a valid image');
    }

    if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
      throw new ValidationError('Uploaded image exceeds maximum allowed size of 8 MB');
    }

    // JPEG: FF D8 FF
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a;
    // WebP: 'RIFF' .... 'WEBP'
    const isWebP =
      buffer.slice(0, 4).toString('ascii') === 'RIFF' &&
      buffer.slice(8, 12).toString('ascii') === 'WEBP';

    if (isJpeg) return 'jpg';
    if (isPng) return 'png';
    if (isWebP) return 'webp';

    throw new ValidationError(
      'Unsupported image file type. Only genuine JPEG, PNG, and WebP images are accepted.'
    );
  }

  /**
   * Generate cryptographically secure random storage key
   * @param {string} prefix
   * @param {string} ext
   * @returns {string}
   */
  generateStorageKey(prefix = 'orig', ext = 'jpg') {
    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(12).toString('hex');
    const cleanExt = ext.replace(/^\./, '').toLowerCase();
    return `${prefix}_${timestamp}_${randomHex}.${cleanExt}`;
  }

  /**
   * Store original image buffer securely
   * @param {Buffer} buffer
   * @param {string} [originalFilename]
   * @returns {Promise<{ key: string, size: number, sha256: string, extension: string }>}
   */
  async saveOriginalImage(buffer, originalFilename = '') {
    const extension = this.validateImageBuffer(buffer);
    const key = this.generateStorageKey('plant', extension);
    const destinationPath = this._resolveSafePath(this.originalDir, key);

    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    await fs.promises.writeFile(destinationPath, buffer);
    logger.debug({ key, size: buffer.length, sha256 }, 'Stored original plant image');

    return {
      key,
      size: buffer.length,
      sha256,
      extension
    };
  }

  /**
   * Store Grad-CAM overlay image from buffer or Base64 string
   * @param {Buffer|string} data
   * @param {string} assessmentId
   * @returns {Promise<string>} Storage key
   */
  async saveGradCamOverlay(data, assessmentId = '') {
    let buffer;
    if (typeof data === 'string') {
      const cleanB64 = data.includes('base64,') ? data.split('base64,')[1] : data;
      buffer = Buffer.from(cleanB64, 'base64');
    } else if (Buffer.isBuffer(data)) {
      buffer = data;
    } else {
      throw new ValidationError('Invalid Grad-CAM artifact data format');
    }

    const key = this.generateStorageKey(`gradcam_${assessmentId.slice(0, 8)}`, 'png');
    const destinationPath = this._resolveSafePath(this.gradCamDir, key);

    await fs.promises.writeFile(destinationPath, buffer);
    logger.debug({ key, size: buffer.length }, 'Stored Grad-CAM overlay artifact');
    return key;
  }

  /**
   * Retrieve file path ensuring strict path traversal prevention
   * @param {string} key
   * @param {'original'|'gradcam'} type
   * @returns {string}
   */
  getFilePath(key, type = 'original') {
    if (!key || typeof key !== 'string') {
      throw new ValidationError('Invalid artifact key');
    }

    const baseDir = type === 'gradcam' ? this.gradCamDir : this.originalDir;
    const safePath = this._resolveSafePath(baseDir, key);

    if (!fs.existsSync(safePath)) {
      throw new NotFoundError(`Image artifact with key '${key}' does not exist on disk`);
    }

    return safePath;
  }

  /**
   * Delete artifact safely
   * @param {string} key
   * @param {'original'|'gradcam'} type
   */
  async deleteArtifact(key, type = 'original') {
    try {
      const filePath = this.getFilePath(key, type);
      await fs.promises.unlink(filePath);
      logger.debug({ key, type }, 'Cleaned up artifact file');
    } catch (err) {
      logger.warn({ error: err.message, key }, 'Failed to delete artifact file or file does not exist');
    }
  }

  /**
   * Resolves target path preventing path traversal
   */
  _resolveSafePath(baseDir, unsafeFilename) {
    const cleanBasename = path.basename(unsafeFilename);
    const resolved = path.resolve(baseDir, cleanBasename);

    if (!resolved.startsWith(baseDir)) {
      throw new ValidationError('Path traversal detected: Access denied to target path');
    }

    return resolved;
  }
}

module.exports = new ImageStorageService();
