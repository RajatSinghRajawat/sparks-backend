const Reel = require("../models/reel.model");
const ReelSave = require("../models/reelSave.model");

// ─────────────────────────────────────────────
// @desc    Toggle save on a reel (save / unsave)
// @route   POST /api/students/reels/:reelId/save
// @access  Private (Student)
// ─────────────────────────────────────────────
const toggleReelSave = async (req, res) => {
  try {
    const { reelId } = req.params;
    const studentId = req.user.id;

    const reel = await Reel.findById(reelId);
    if (!reel) {
      return res.status(404).json({
        success: false,
        message: "Reel not found",
      });
    }

    const existingSave = await ReelSave.findOne({
      reel: reelId,
      savedBy: studentId,
    });

    if (existingSave) {
      await ReelSave.deleteOne({ _id: existingSave._id });
      return res.status(200).json({
        success: true,
        message: "Reel unsaved",
        data: {
          saved: false,
        },
      });
    }

    await ReelSave.create({
      reel: reelId,
      savedBy: studentId,
    });

    res.status(200).json({
      success: true,
      message: "Reel saved",
      data: {
        saved: true,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Already saved this reel",
      });
    }
    console.error("❌ Toggle Reel Save Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update save.",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Get save status for a reel (savedByMe)
// @route   GET /api/students/reels/:reelId/save
// @access  Private (Student)
// ─────────────────────────────────────────────
const getReelSaveStatus = async (req, res) => {
  try {
    const { reelId } = req.params;
    const studentId = req.user.id;

    const reel = await Reel.findById(reelId).select("_id");
    if (!reel) {
      return res.status(404).json({
        success: false,
        message: "Reel not found",
      });
    }

    const savedByMe = await ReelSave.exists({
      reel: reelId,
      savedBy: studentId,
    });

    res.status(200).json({
      success: true,
      data: {
        savedByMe: !!savedByMe,
      },
    });
  } catch (error) {
    console.error("❌ Get Reel Save Status Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to get save status.",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

module.exports = {
  toggleReelSave,
  getReelSaveStatus,
};
