const AgriculturalRecord = require('../models/AgriculturalRecord');
const Farm = require('../models/Farm');
const { ROLES } = require('../constants/roles');
const { NotFoundError, ForbiddenError } = require('../errors/AppError');

class AgriculturalRecordService {
  /**
   * Create an agricultural record linked to a verified farm
   * @param {object} user Authenticated user
   * @param {object} data
   * @returns {Promise<object>}
   */
  async createRecord(user, data) {
    // Verify referenced farm exists
    const farm = await Farm.findOne({ _id: data.farmId, isArchived: false });
    if (!farm) {
      throw new NotFoundError(`Referenced Farm with ID '${data.farmId}' not found`);
    }

    // Enforce farm ownership: only the farm owner or an admin can create records for this farm
    if (
      user.role !== ROLES.ADMIN &&
      farm.ownerId.toString() !== user._id.toString()
    ) {
      throw new ForbiddenError('You can only create agricultural records for farms you own');
    }

    const record = await AgriculturalRecord.create({
      ...data,
      ownerId: user._id
    });

    return record;
  }

  /**
   * List agricultural records with ownership filtering and pagination
   * @param {object} user
   * @param {object} query
   * @returns {Promise<{ records: Array, pagination: object }>}
   */
  async listRecords(user, query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { isArchived: false };

    // Strict ownership for FARMER
    // Strict ownership: Only ADMIN can query arbitrary ownerId. All other roles only view their own records
    if (user.role !== ROLES.ADMIN) {
      filter.ownerId = user._id;
    } else if (query.ownerId) {
      filter.ownerId = query.ownerId;
    }

    if (query.farmId) {
      filter.farmId = query.farmId;
    }

    if (query.cropType) {
      filter.cropType = query.cropType;
    }

    const [records, totalCount] = await Promise.all([
      AgriculturalRecord.find(filter)
        .populate('farmId', 'farmName district supportedCrops')
        .sort({ plantingDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AgriculturalRecord.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return {
      records,
      pagination: {
        page,
        limit,
        totalRecords: totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Get single agricultural record by ID with ownership verification
   * @param {object} user
   * @param {string} recordId
   * @returns {Promise<object>}
   */
  async getRecordById(user, recordId) {
    const record = await AgriculturalRecord.findOne({ _id: recordId, isArchived: false }).populate(
      'farmId',
      'farmName district supportedCrops'
    );

    if (!record) {
      throw new NotFoundError(`Agricultural record with ID '${recordId}' not found`);
    }

    // Check ownership: Only record owner or ADMIN can view
    if (
      user.role !== ROLES.ADMIN &&
      record.ownerId.toString() !== user._id.toString()
    ) {
      throw new ForbiddenError('You do not have permission to view this agricultural record');
    }

    return record;
  }

  /**
   * Update agricultural record with ownership check
   * @param {object} user
   * @param {string} recordId
   * @param {object} data
   * @returns {Promise<object>}
   */
  async updateRecord(user, recordId, data) {
    const record = await AgriculturalRecord.findOne({ _id: recordId, isArchived: false });
    if (!record) {
      throw new NotFoundError(`Agricultural record with ID '${recordId}' not found`);
    }

    if (
      user.role !== ROLES.ADMIN &&
      record.ownerId.toString() !== user._id.toString()
    ) {
      throw new ForbiddenError('You do not have permission to modify this agricultural record');
    }

    // Apply updates safely
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && key !== 'ownerId' && key !== 'isArchived' && key !== 'farmId') {
        record[key] = data[key];
      }
    });

    await record.save();
    return record;
  }

  /**
   * Soft delete agricultural record with ownership check
   * @param {object} user
   * @param {string} recordId
   * @returns {Promise<{ success: boolean }>}
   */
  async deleteRecord(user, recordId) {
    const record = await AgriculturalRecord.findOne({ _id: recordId, isArchived: false });
    if (!record) {
      throw new NotFoundError(`Agricultural record with ID '${recordId}' not found`);
    }

    if (
      user.role !== ROLES.ADMIN &&
      record.ownerId.toString() !== user._id.toString()
    ) {
      throw new ForbiddenError('You do not have permission to delete this agricultural record');
    }

    record.isArchived = true;
    record.archivedAt = new Date();
    await record.save();

    return { success: true };
  }
}

module.exports = new AgriculturalRecordService();
