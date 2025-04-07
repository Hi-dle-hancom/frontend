const bcrypt = require("bcrypt");
const User = require("../schemas/user");

exports.join = async (req, res, next) => {
  const { email, nick, password, money } = req.body;
  try {
    const exUser = await User.findOne({ email });
    if (exUser) {
      return res.redirect("/join?error=exist");
    }
    const user = new User({
      email,
      nick,
      password,
      money: parseInt(money, 10),
    });
    await user.save();
    return res.redirect("/");
  } catch (error) {
    console.error(error);
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.redirect("/?loginError=존재하지 않는 이메일입니다");
    }
    const result = await bcrypt.compare(password, user.password);
    if (!result) {
      return res.redirect("/?loginError=비밀번호가 일치하지 않습니다");
    }
    req.session.user = {
      id: user._id,
      email: user.email,
      nick: user.nick,
      money: user.money,
    };
    res.redirect("/");
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
};
