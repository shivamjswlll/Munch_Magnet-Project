const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo")
const mongoose = require("mongoose");
const passport = require("passport");
const localStrategy = require("passport-local");
const models = require("./models");
const path = require("path");
const ejs = require("ejs");
const app = express();
const MongoURL = process.env.ATLASDB_URL;
const secret = process.env.USER_SECRET;
const main = async () => {
  await mongoose.connect(MongoURL);
  // mongoose.connect("mongodb://127.0.0.1:27017/munch_magnet");
};

main()
  .then(() => {
    console.log("database connected successfully");
  })
  .catch((err) => {
    console.log(err);
  });
const store = MongoStore.create({
    mongoUrl:MongoURL,
    crypto:{secret},
    touchAfter:24*60*60
})
store.on("error",()=>{
  console.log("ERROR IN MONGO SESSION STORE",err)
})
const sessionObject = {
  store,
  secret,
  resave: false,
  saveUninitialized: true,
  cookie:{
    expires:Date.now()+(7*24*60*60*1000),
    maxAge:7*24*60*60*1000,
    httpOnly:true
  }
};
app.use("/restaurant/", (req, res, next) => {
  sessionObject.secret = "ggjhvfgjhvgs8437972490";
  next();
});
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(session(sessionObject));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(models.User.authenticate()));

passport.serializeUser(models.User.serializeUser());
passport.deserializeUser(models.User.deserializeUser());

app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

app.get("/signup", (req, res) => {
  res.render("signup.ejs");
});
app.post("/signup", async (req, res, next) => {
  try {
    let { username, email, password } = req.body;
    const newUser = new models.User({ username, email });
    const registeredUser = await models.User.register(newUser, password);
    console.log(registeredUser);
    req.logIn(registeredUser, (err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  } catch (e) {
    res.send(e.message);
  }
});
app.get("/signin", (req, res) => {
  res.render("signin.ejs");
});
app.post(
  "/signin",
  passport.authenticate("local", { failureRedirect: "/signin" }),
  async (req, res) => {
    res.redirect("/");
  }
);

app.use((req, res, next) => {
  res.locals.user = req.user;
  if (!req.isAuthenticated()) return res.redirect("/signin");
  else next();
});

app.get("/", async (req, res) => {
  const restaurants = await models.Restaurant.find({});
  // console.log(restaurants);
  // res.send("restaurants");

  res.render("home.ejs", { restaurants });
});
app.get("/items", async (req, res) => {
  // console.log(restaurants)
  const { _id } = req.query;
  restaurant = await (await models.Restaurant.findById(_id)).populate("menu");
  res.render("menu.ejs", { restaurant });
});

app.post("/items", async (req, res) => {
  let cartItem = new models.Cart({
    restaurant: req.body.restaurant_id,
    dish: req.body.dish_id,
  });
  const cart_id = (await cartItem.save())._id;
  await models.User.findByIdAndUpdate(req.user._id, {
    $push: { cart: cart_id },
  });
  // res.send("Added successful")
  res.redirect(`/items?_id=${req.body.restaurant_id}`);
});

app.get("/cart", async (req, res) => {
  const cart = (
    await models.User.findById(req.user._id).populate({
      path: "cart",
      populate: [
        { path: "restaurant", model: "Restaurant" },
        { path: "dish", model: "Dish" },
      ],
    })
  ).cart;
  res.render("cart.ejs", { cart });
});

app.post("/cart", async (req, res) => {
  try {
    const cartItem_id = req.body.cart_id;
    await models.Cart.findByIdAndDelete(cartItem_id);
    await models.User.findByIdAndUpdate(req.user._id, {
      $pull: { cart: cartItem_id },
    });
  } catch (e) {
    next(e);
  }
  res.redirect(`/cart`);
});

app.get("/order", async (req, res) => {
  const order = (
    await models.User.findById(req.user._id).populate({
      path: "order",
      populate: [
        { path: "restaurant", model: "Restaurant" },
        { path: "dish", model: "Dish" },
      ],
    })
  ).order;
  res.render("order.ejs", { order });
});

app.post("/order", async (req, res) => {
  try {
    const user = await (
      await models.User.findById(req.user._id)
    ).populate("cart");
    const cart = user.cart;
    // user.order = user.order.concat(orders);
    for (item of cart) {
      const order = new models.Order({
        restaurant: item.restaurant,
        dish: item.dish,
        user: req.user._id,
      });
      const savedOrder = await order.save();
      user.order.push(savedOrder._id);
      await models.Cart.findByIdAndDelete(item._id);
    }
    user.cart = [];
    await user.save();
  } catch (e) {
    next(e);
  }
  res.redirect(`/order`);
});
app.get("/profile", (req, res, next) => {
  try {
    const user = req.user;
    res.render("profile.ejs", { user });
  } catch (e) {
    next(e);
  }
});

app.get("/updatepassword", (req, res) => {
  res.render("update_password.ejs");
});
app.post(
  "/updatepassword",
  passport.authenticate("local", { failureRedirect: "/signin" }),
  async (req, res, next) => {
    try {
      let [username, email, new_password] = [
        "dummy_user",
        "dummy@dummy.com",
        req.body.new_password,
      ];
      const dummyUser = new models.User({ username, email });
      const registeredDummyUser = await models.User.register(
        dummyUser,
        new_password
      );
      // console.log(registeredUser);
      await models.User.findByIdAndUpdate(req.user._id, {
        salt: registeredDummyUser.salt,
        hash: registeredDummyUser.hash,
      });
      await models.User.findByIdAndDelete(registeredDummyUser._id);
      res.redirect("/profile");
    } catch (e) {
      next(e);
    }
  }
);

app.get("/qr", async (req, res, next) => {
  // console.log(restaurants)
  try {
    const { order_id } = req.query;
    console.log(order_id);
    res.render("qr.ejs", { order_id });
  } catch (e) {
    next(e);
  }
});

app.get("/logout", (req, res, next) => {
  try {
    req.logOut((err) => {
      if (err) {
        return next(err);
      }
    });
  } catch (e) {
    console.log(e.message);
  } finally {
    res.redirect("/signin");
  }
});

app.listen(8080, () => {
  console.log("App is listening on port: 8080");
});
