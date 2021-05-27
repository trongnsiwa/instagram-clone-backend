import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import Pusher from "pusher";
import dbModel from "./dbModel.js";

// app config
const app = express();
const port = process.env.PORT || 8080;

const pusher = new Pusher({
  appId: "1201548",
  key: "a82ca39d5c75e8cbe9b8",
  secret: "81cbcffa2f643004d279",
  cluster: "ap1",
  useTLS: true,
});

// middlewares
app.use(express.json());
app.use(cors());

// DB config
const connect_url =
  "mongodb+srv://admin:sYHOVf5MCpJzkoMi@cluster0.xyyco.mongodb.net/instaDB?retryWrites=true&w=majority";
mongoose.connect(connect_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.once("open", () => {
  console.log("DB Connected");

  const changeStream = mongoose.connection.collection("posts").watch();

  changeStream.on("change", (change) => {
    console.log("Change Triggered on pusher ...");
    console.log(change);
    console.log("End of Change");

    if (change.operationType === "insert") {
      console.log("Triggering Pusher ***IMG UPLOAD***");

      const postDetails = change.fullDocument;
      pusher.trigger("posts", "inserted", {
        user: postDetails.user,
        caption: postDetails.caption,
        image: postDetails.image,
      });
    } else {
      console.log("Error trigger from Pusher");
    }
  });
});

// api routes
app.get("/", (req, res) => res.status(200).send("hello world"));

app.post("/upload", (req, res) => {
  const body = req.body;

  dbModel.create(body, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

app.get("/sync", (req, res) => {
  dbModel.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

// listener
app.listen(port, () => console.log(`listening on localhost:${port}`));
