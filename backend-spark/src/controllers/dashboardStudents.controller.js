/**
 * Dashboard students – admin only.
 * GET /api/admin/dashboard/students?page&limit&search&status=all|active|inactive
 * GET /api/admin/dashboard/students/:studentId
 * PATCH /api/admin/dashboard/students/:studentId  { name?, email?, phone?, isActive? }
 */

const Student = require("../models/student.model");
const mongoose = require("mongoose");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

// ─────────────────────────────────────────────
// @desc    Get students list with pagination, search, status filter
// @route   GET /api/admin/dashboard/students
// @access  Private (Admin)
// ─────────────────────────────────────────────
const getStudentList = async (req, res) => {
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
        ...(search.match(/^\d+$/) ? [{ phone: { $regex: search, $options: "i" } }] : []),
      ];
    }

    const [students, total] = await Promise.all([
      Student.find(filter)
        .select("name email phone isActive isVerified createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Student.countDocuments(filter),
    ]);

    const list = students.map((s) => ({
      _id: s._id.toString(),
      name: s.name || "",
      email: s.email || "",
      phone: s.phone || "",
      isActive: !!s.isActive,
      isVerified: !!s.isVerified,
      createdAt: s.createdAt,
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
    console.error("Dashboard getStudentList Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to load students.",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Get single student by ID (detail)
// @route   GET /api/admin/dashboard/students/:studentId
// @access  Private (Admin)
// ─────────────────────────────────────────────
const getStudentById = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!studentId || !mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({ success: false, message: "Valid student ID is required." });
    }

    const student = await Student.findById(studentId)
      .select("name email phone isActive isVerified avatar createdAt updatedAt")
      .lean();
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    res.status(200).json({
      success: true,
      data: {
        student: {
          _id: student._id.toString(),
          name: student.name,
          email: student.email,
          phone: student.phone || null,
          isActive: !!student.isActive,
          isVerified: !!student.isVerified,
          avatar: student.avatar || null,
          createdAt: student.createdAt,
          updatedAt: student.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("Dashboard getStudentById Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to load student.",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Update student (name, email, phone, isActive)
// @route   PATCH /api/admin/dashboard/students/:studentId
// @access  Private (Admin)
// ─────────────────────────────────────────────
const updateStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { name, email, phone, isActive } = req.body;

    if (!studentId || !mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({ success: false, message: "Valid student ID is required." });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    if (name !== undefined) student.name = String(name).trim();
    if (email !== undefined) student.email = String(email).toLowerCase().trim();
    if (phone !== undefined) student.phone = phone ? String(phone).trim() : null;
    if (typeof isActive === "boolean") student.isActive = isActive;

    await student.save();

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: {
        student: {
          _id: student._id.toString(),
          name: student.name,
          email: student.email,
          phone: student.phone || "",
          isActive: student.isActive,
          isVerified: student.isVerified,
        },
      },
    });
  } catch (error) {
    console.error("Dashboard updateStudent Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update student.",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

module.exports = { getStudentList, getStudentById, updateStudent };
