import Category from '../models/Category.js';
import Pin from '../models/Pin.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category by ID or slug
// @route   GET /api/categories/:id
// @access  Public
export const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let category = await Category.findById(id);

    if (!category) {
      category = await Category.findOne({ slug: id });
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private
export const createCategory = async (req, res, next) => {
  try {
    const { name, slug, description, image_url, type, members } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
      });
    }

    const cleanSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = await Category.findOne({ slug: cleanSlug });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A category with this name or slug already exists',
      });
    }

    const category = await Category.create({
      name: name.trim(),
      slug: cleanSlug,
      description: description || '',
      image_url: image_url || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
      type: type || 'personal',
      members: Array.isArray(members) ? members : [],
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
export const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const { name, description, image_url, type, members } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Category name cannot be empty',
        });
      }
      updates.name = name.trim().slice(0, 100);
    }
    if (description !== undefined) {
      updates.description = String(description).slice(0, 1000);
    }
    if (image_url !== undefined) {
      updates.image_url = String(image_url).trim();
    }
    if (type !== undefined) {
      updates.type = type;
    }
    if (members !== undefined && Array.isArray(members)) {
      updates.members = members;
    }

    const updated = await Category.findByIdAndUpdate(req.params.id, updates);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin or Owner)
export const deleteCategory = async (req, res, next) => {
  try {
    const catId = req.params.id || req.params.categoryId;
    const category = await Category.findById(catId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    await Category.findByIdAndDelete(catId);

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member/friend to category
// @route   POST /api/categories/:id/members
// @access  Private
export const addMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { member, friend } = req.body;
    const memberData = member || friend;

    if (!memberData) {
      return res.status(400).json({
        success: false,
        message: 'Member details are required',
      });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    let members = Array.isArray(category.members) ? [...category.members] : [];
    if (!members.some((m) => String(m.id) === String(memberData.id))) {
      members.push(memberData);
    }

    const updated = await Category.findByIdAndUpdate(id, { members });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from category
// @route   DELETE /api/categories/:id/members/:memberId
// @access  Private
export const removeMember = async (req, res, next) => {
  try {
    const { id, memberId } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    let members = Array.isArray(category.members) ? [...category.members] : [];
    members = members.filter((m) => String(m.id) !== String(memberId));

    const updated = await Category.findByIdAndUpdate(id, { members });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  addMember,
  removeMember,
};
