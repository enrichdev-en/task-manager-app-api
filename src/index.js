const express = require("express");
require("./db/mongoose");

const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");

const app = express();

// express register middleware for maintainence
/* app.use((req, res, next) => {
  res.status(503).send("Site is currently under maintenance");
}); */

// express middleware to parse json request
app.use(express.json());

// Register the routers (must be after app assign and app.use(json))
app.use(userRouter);
app.use(taskRouter);

const port = process.env.PORT;

app.listen(port, () => console.log(`Listening server on port: ${port}`));
