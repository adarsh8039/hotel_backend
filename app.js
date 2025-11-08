const createError = require("http-errors");
const express = require("express");
const session = require("express-session");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const serverless = require("serverless-http");

const cors = require("cors");
const {PrismaClient} = require("@prisma/client");
const prisma = new PrismaClient();
const {verifyToken} = require("./middlewares/validation");

const NodeCache = require("node-cache");

// Create a new cache instance
const myCache = new NodeCache();

const indexRouter = require("./routes/index");
const loginRouter = require("./routes/loginroutes");
const vendorRouter = require("./routes/vendor.routes");

const app = express();
app.set("prisma", prisma);
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({extended: false}));

const corsOptions = {
  origin: "https://pms.trackable.in",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // if you need to send cookies or auth headers
};

app.use(cors(corsOptions));

// const allowedOrigins = ["https://pms.trackable.in"];

// const corsOptions = {
//   origin: function (origin, callback) {
//     // Allow requests with no origin (like mobile apps or curl)
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: true,
// };
app.use(cookieParser());
// Session middleware setup
app.use(
  session({
    secret: "jhsf634jnkf",
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
// Make the cache instance available throughout the app
app.set("cache", myCache);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/admin", loginRouter);
app.use("/vendor", vendorRouter);

app.use("/", verifyToken, indexRouter);

app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500).json({status: false, message: err.message});
});

module.exports = app;
