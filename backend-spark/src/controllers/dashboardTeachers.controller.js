/**
 * Dashboard teachers – admin only.
 * GET /api/admin/dashboard/teachers?page&limit&search&status=all|active|inactive
 * GET /api/admin/dashboard/teachers/:teacherId
 * PATCH /api/admin/dashboard/teachers/:teacherId  { name?, email?, phone?, isActive? }
 */

const Teacher = require("../models/teacher.model");
const mongoose = require("mongoose");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

// ─────────────────────────────────────────────
// @desc    Get teachers list with pagination, search, status filter
// @route   GET /api/admin/dashboard/teachers
// @access  Private (Admin)
// ─────────────────────────────────────────────
const getTeacherList = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_LIMIT));
    const search = (req.query.search || "").trim();
    const status = req.query.status === "inactive" ? "inactive" : req.query.status === "active" ? "active" : "all";

    const filter = {};
    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const [teachers, total] = await Promise.all([
      Teacher.find(filter)
        .select("name email phone isActive isVerified createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Teacher.countDocuments(filter),
    ]);

    const list = teachers.map((t) => ({
      _id: t._id.toString(),
      name: t.name || "",
      email: t.email || "",
      phone: t.phone || "",
      isActive: !!t.isActive,
      isVerified: !!t.isVerified,
      createdAt: t.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        list,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    console.error("Dashboard getTeacherList Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to load teachers.",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Get single teacher by ID (detail)
// @route   GET /api/admin/dashboard/teachers/:teacherId
// @access  Private (Admin)
// ─────────────────────────────────────────────
const getTeacherById = async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (!teacherId || !mongoose.isValidObjectId(teacherId)) {
      return res.status(400).json({ success: false, message: "Valid teacher ID is required." });
    }

    const teacher = await Teacher.findById(teacherId)
      .select("name email phone isActive isVerified avatar createdAt updatedAt")
      .lean();
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found." });
    }

    res.status(200).json({
      success: true,
      data: {
        teacher: {
          _id: teacher._id.toString(),
          name: teacher.name,
          email: teacher.email,
          phone: teacher.phone,
          isActive: !!teacher.isActive,
          isVerified: !!teacher.isVerified,
          avatar: teacher.avatar || null,
          createdAt: teacher.createdAt,
          updatedAt: teacher.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("Dashboard getTeacherById Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to load teacher.",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Update teacher (name, email, phone, isActive)
// @route   PATCH /api/admin/dashboard/teachers/:teacherId
// @access  Private (Admin)
// ─────────────────────────────────────────────
const updateTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { name, email, phone, isActive } = req.body;

    if (!teacherId || !mongoose.isValidObjectId(teacherId)) {
      return res.status(400).json({ success: false, message: "Valid teacher ID is required." });
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found." });
    }

    if (name !== undefined) teacher.name = String(name).trim();
    if (email !== undefined) teacher.email = String(email).toLowerCase().trim();
    if (phone !== undefined) teacher.phone = String(phone).trim();
    if (typeof isActive === "boolean") teacher.isActive = isActive;

    await teacher.save();

    res.status(200).json({
      success: true,
      message: "Teacher updated successfully",
      data: {
        teacher: {
          _id: teacher._id.toString(),
          name: teacher.name,
          email: teacher.email,
          phone: teacher.phone,
          isActive: teacher.isActive,
          isVerified: teacher.isVerified,
        },
      },
    });
  } catch (error) {
    console.error("Dashboard updateTeacher Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update teacher.",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

module.exports = { getTeacherList, getTeacherById, updateTeacher };
