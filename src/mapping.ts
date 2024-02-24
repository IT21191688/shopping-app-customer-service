import UserRouter from "./routes/user-route";
import constants from "./utills/constants";
import { Express } from "express";

const requestMappings = (app: Express) => {
  app.use("/api/v1/user", UserRouter);
};

export default requestMappings;
