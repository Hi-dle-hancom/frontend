const Good = require("../schemas/good");
const Auction = require("../schemas/auction");
const User = require("../schemas/user");
const fs = require("fs");
const path = require("path");
const { removeGood } = require("../services");

exports.renderMain = async (req, res, next) => {
  try {
    const newGoods = await Good.find({ status: "SALE", deleted: { $ne: true } })
      .populate("owner", "nick")
      .sort("-createdAt");
    res.render("main", {
      title: "경매 메인",
      newGoods,
      user: req.session.user,
      loginError: req.query.loginError,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.renderJoin = (req, res) => {
  res.render("join", {
    title: "회원가입",
    error: req.query.error,
    user: req.session.user,
  });
};

exports.renderGood = (req, res) => {
  res.render("good", {
    title: "경매 등록",
    user: req.session.user,
  });
};

exports.createGood = async (req, res, next) => {
  try {
    const { name, price, endTime } = req.body;
    const good = await Good.create({
      name,
      img: req.file ? req.file.filename : null,
      price: parseInt(price, 10),
      endTime: new Date(endTime),
      owner: req.session.user.id,
    });
    const io = req.app.get("io");
    io.emit("newGood", { good });
    res.redirect("/");
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.renderAuction = async (req, res, next) => {
  try {
    const [good, auctions] = await Promise.all([
      Good.findById(req.params.id).populate("owner", "nick"),
      Auction.find({ good: req.params.id })
        .populate("bidder", "nick")
        .sort("bid"),
    ]);
    if (!good) {
      return res.status(404).send("존재하지 않는 경매입니다");
    }

    // auctions 배열을 good 객체에 연결
    good.bid = auctions.map((auction) => ({
      bid: auction.bid,
      msg: auction.msg,
      user: { nick: auction.bidder.nick },
      createdAt: auction.createdAt,
    }));

    res.render("auction", {
      title: `${good.name} - 경매`,
      good,
      auctions,
      user: req.session.user,
      goodOwnerId: good.owner._id.toString(),
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.bid = async (req, res, next) => {
  try {
    const { bid, msg } = req.body;
    const good = await Good.findById(req.params.id);
    if (!good) {
      return res.status(404).send("존재하지 않는 상품입니다");
    }
    if (good.price >= bid) {
      return res.status(403).send("시작 가격보다 높게 입찰해야 합니다");
    }
    if (new Date(good.endTime).valueOf() < new Date().valueOf()) {
      return res.status(403).send("경매가 이미 종료되었습니다");
    }
    if (good.owner.toString() === req.session.user.id) {
      return res.status(403).send("자신이 등록한 상품은 입찰할 수 없습니다");
    }
    // 기존 입찰 내역 체크
    const highestBid = await Auction.findOne({ good: req.params.id }).sort(
      "-bid"
    );
    if (highestBid && highestBid.bid >= bid) {
      return res.status(403).send("이전 입찰가보다 높아야 합니다");
    }

    // 입찰 내역 생성
    const auction = await Auction.create({
      good: req.params.id,
      bidder: req.session.user.id,
      bid: parseInt(bid, 10),
      msg,
    });
    await Auction.populate(auction, { path: "bidder", select: "nick" });

    req.app.get("io").to(req.params.id).emit("bid", {
      bid: auction.bid,
      msg: auction.msg,
      nick: auction.bidder.nick,
      date: auction.createdAt,
    });
    return res.send("ok");
  } catch (error) {
    console.error(error);
    return next(error);
  }
};

exports.renderList = async (req, res, next) => {
  try {
    let goods;

    // 로그인한 경우는 자신의 경매를 보여주고, 그렇지 않은 경우 모든 경매 표시
    if (req.session.user) {
      goods = await Good.find({
        owner: req.session.user.id,
        deleted: { $ne: true },
      })
        .populate("buyer", "nick")
        .sort("-createdAt");

      // 각 경매에 대한 입찰 정보 가져오기
      for (const good of goods) {
        const highestBid = await Auction.findOne({ good: good._id }).sort(
          "-bid"
        );
        good.highestBid = highestBid ? highestBid.bid : 0;
        good.bidCount = await Auction.countDocuments({ good: good._id });
      }
    } else {
      // 로그인하지 않은 경우 모든 경매 표시
      goods = await Good.find({ deleted: { $ne: true } })
        .populate("owner", "nick")
        .sort("-createdAt");

      // 각 경매에 대한 입찰 정보 가져오기
      for (const good of goods) {
        const highestBid = await Auction.findOne({ good: good._id }).sort(
          "-bid"
        );
        good.highestBid = highestBid ? highestBid.bid : 0;
        good.bidCount = await Auction.countDocuments({ good: good._id });
      }
    }

    res.render("list", {
      title: "경매 목록",
      goods,
      user: req.session.user,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.removeGood = async (req, res, next) => {
  try {
    const good = await Good.findById(req.params.id);
    if (!good) {
      return res.status(404).send("존재하지 않는 경매입니다");
    }
    if (good.owner.toString() !== req.session.user.id) {
      return res.status(403).send("권한이 없습니다");
    }
    await removeGood(req.params.id);
    res.send("ok");
  } catch (error) {
    console.error(error);
    next(error);
  }
};
