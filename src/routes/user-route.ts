import { Router } from "express";
import UserMiddleware from "../middlewares/user-middleware";

import {
  RegisterUser,
  GetUserProfile,
  GetAllUsers,
  EditUserDetails,
  EditUserDetailsUserId,
  SendVerificationCode,
  ResetPassword,
  UserLogin,
  Data,
} from "../controllers/user-controller";
import constants from "../utills/constants";

const UserRouter = Router();

UserRouter.post("/register", RegisterUser);

UserRouter.get("/data", Data);

UserRouter.get(
  "/profile",
  UserMiddleware.authorize([
    constants.USER.ROLES.ADMIN,
    constants.USER.ROLES.USER,
  ]),
  GetUserProfile
);

UserRouter.post("/sendVerificationCode", SendVerificationCode);

UserRouter.post("/resetPassword", ResetPassword);

UserRouter.get(
  "/getAllUser",
  UserMiddleware.authorize([constants.USER.ROLES.ADMIN]),
  GetAllUsers
);

UserRouter.post(
  "/updateUser",
  UserMiddleware.authorize([
    constants.USER.ROLES.ADMIN,
    constants.USER.ROLES.USER,
  ]),
  EditUserDetails
);

UserRouter.post(
  "/updateUser/:userId",
  UserMiddleware.authorize([constants.USER.ROLES.ADMIN]),
  EditUserDetailsUserId
); //
export default UserRouter;
