const express = require("express");
const cors = require("cors");
const listEndpoints = require("express-list-endpoints");
const {
  badRequestHandler,
  notFoundHandler,
  unauthorizedHandler,
  forbiddenHandler,
  catchAllHandler,
} = require("./errorHandling");
const helmet = require("helmet");
const exam = require("./services/exam");
const questions = require("./services/questions");
const port = process.env.PORT || 4000;
const server = express();
server.use(helmet());
server.use(cors());
server.use(express.json());

server.use("/", exam);
server.use("/questions", questions);

server.use(badRequestHandler);
server.use(notFoundHandler);
server.use(unauthorizedHandler);
server.use(forbiddenHandler);
server.use(catchAllHandler);

console.log(listEndpoints(server));

server.listen(port, () => {
  if (process.env.NODE_ENV === "production") {
    console.log("Running on cloud on port", port);
  } else {
    console.log("Running locally on port", port);
  }
});
