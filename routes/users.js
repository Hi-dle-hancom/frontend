const express = require("express");
const router = express.Router();
const User = require("../models/user");

// 사용자 목록 조회
router.get("/", async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ created_at: -1 });
    res.render("users/index", { users });
  } catch (err) {
    console.error("사용자 목록 조회 중 오류 발생:", err);
    next(err);
  }
});

// 사용자 생성 폼
router.get("/new", (req, res) => {
  res.render("users/new");
});

// 사용자 상세 조회
router.get("/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).render("error", {
        message: "사용자를 찾을 수 없습니다",
        error: { status: 404 },
      });
    }
    res.render("users/show", { user });
  } catch (err) {
    console.error("사용자 상세 조회 중 오류 발생:", err);
    next(err);
  }
});

// 사용자 생성
router.post("/", async (req, res, next) => {
  try {
    const { name, age, married } = req.body;
    const user = new User({
      name,
      age: parseInt(age),
      married: married === "on" || married === "true" || married === "Y",
    });
    await user.save();
    res.redirect("/users");
  } catch (err) {
    console.error("사용자 생성 중 오류 발생:", err);
    next(err);
  }
});

// 사용자 수정 폼
router.get("/:id/edit", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).render("error", {
        message: "사용자를 찾을 수 없습니다",
        error: { status: 404 },
      });
    }
    res.render("users/edit", { user });
  } catch (err) {
    console.error("사용자 수정 폼 조회 중 오류 발생:", err);
    next(err);
  }
});

// 사용자 수정
router.put("/:id", async (req, res, next) => {
  try {
    const { name, age, married } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        name,
        age: parseInt(age),
        married: married === "on" || married === "true" || married === "Y",
        updated_at: new Date(),
      },
      {
        new: true,
        runValidators: true,
      }
    );
    if (!user) {
      return res.status(404).render("error", {
        message: "사용자를 찾을 수 없습니다",
        error: { status: 404 },
      });
    }
    res.redirect("/users");
  } catch (err) {
    console.error("사용자 수정 중 오류 발생:", err);
    next(err);
  }
});

// 사용자 삭제
router.delete("/:id", async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { deleted_at: new Date() },
      { new: true }
    );
    if (!user) {
      return res.status(404).render("error", {
        message: "사용자를 찾을 수 없습니다",
        error: { status: 404 },
      });
    }
    res.redirect("/users");
  } catch (err) {
    console.error("사용자 삭제 중 오류 발생:", err);
    next(err);
  }
});

module.exports = router;
