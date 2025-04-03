const express = require("express");
const router = express.Router();
const { User } = require("../models");

// 사용자 목록 조회
router.get("/", async (req, res, next) => {
  try {
    const users = await User.findAll();
    res.render("users/index", { users });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// 새 사용자 추가 폼
router.get("/new", (req, res) => {
  res.render("users/new");
});

// 사용자 추가 처리
router.post("/", async (req, res, next) => {
  try {
    const { name, age, married } = req.body;
    await User.create({
      name,
      age,
      married: married === "Y" || married === "true" || married === "on",
    });
    res.redirect("/users");
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// 사용자 수정 폼
router.get("/edit/:id", async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id } });
    if (!user) {
      return res.status(404).render("error", {
        message: "사용자를 찾을 수 없습니다",
        error: { status: 404 },
      });
    }
    res.render("users/edit", { user });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// 사용자 수정 처리
router.post("/edit/:id", async (req, res, next) => {
  try {
    const { name, age, married } = req.body;
    await User.update(
      {
        name,
        age,
        married: married === "Y" || married === "true" || married === "on",
      },
      {
        where: { id: req.params.id },
      }
    );
    res.redirect("/users");
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// 사용자 삭제
router.get("/delete/:id", async (req, res, next) => {
  try {
    await User.destroy({ where: { id: req.params.id } });
    res.redirect("/users");
  } catch (err) {
    console.error(err);
    next(err);
  }
});

module.exports = router;
