const path = require("path");

const fileUpload = require("express-fileupload");
const express = require("express");
const mongoose = require("mongoose");
const dotEnv = require("dotenv");

const connectDB = require("./config/db");
const{errorHandler}=require("./middlewares/errors");
const { setHeader } = require("./middlewares/headers");
//* Load Config
dotEnv.config({ path: "./config/config.env" });

//* Database connection
connectDB();


const app = express();

//* BodyPaser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(setHeader)
//* File Upload Middleware
app.use(fileUpload());



//* Static Folder
app.use(express.static(path.join(__dirname, "public")));

//* Routes
app.use("/", require("./routes/blog"));
app.use("/users", require("./routes/users"));
app.use("/dashboard", require("./routes/dashboard"));

//ErrorController
app.use(errorHandler)
const PORT = process.env.PORT || 3333;

app.listen(PORT, () =>
    console.log(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    )
);
