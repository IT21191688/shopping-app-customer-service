import { Request, Response } from "express";
import userUtil from "../utills/user-utill";
import userService from "../services/user-service";
import User from "../models/user-model";
//import Auth from "../auth/auth.model";
import { StatusCodes } from "http-status-codes";
import { startSession } from "mongoose";
import CustomResponse from "../utills/responce";

import { sendEmail } from "../utills/email/email-server";
import emailService from "../utills/email/email-templates";

// Import custom errors
import NotFoundError from "../utills/error/error.classes/NotFoundError";
import BadRequestError from "../utills/error/error.classes/BadRequestError";
import constants from "../utills/constants";

// const RegisterUser = async (req: Request, res: Response) => {
//   console.log("Hello Hello");
// };

const RegisterUser = async (req: Request, res: Response) => {
  const body: any = req.body;
  const user: any = new User(body.user);

  //console.log(user.email);

  const existingUser = await userService.findByEmail(user.email);

  if (existingUser) {
    throw new BadRequestError("User already exists!");
  }

  /*
  const auth = new Auth();
  auth._id = user.email;
  auth.password = await userUtil.hashPassword(body.user.password);
  auth.user = user._id;
  */

  let createdUser = null;

  user.password = await userUtil.hashPassword(body.user.password);

  const session = await startSession();

  try {
    session.startTransaction();

    createdUser = await userService.save(user, session);

    // console.log(createdUser);

    if (createdUser != null) {
      // Prepare and send email content
      const subject = "Register Success";
      const htmlBody = emailService.UserRegisteredEmail({
        fullName: createdUser.firstname + " " + createdUser.lastname,
      });

      await sendEmail(user.email, subject, htmlBody, null);
    }

    //await userService.save(auth, session);

    await session.commitTransaction();
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    //end session
    session.endSession();
  }

  return CustomResponse(
    res,
    true,
    StatusCodes.CREATED,
    "User registered successfully!",
    createdUser
  );
};

const UserLogin = async (req: Request, res: Response) => {
  const body: any = req.body;

  if (!body.email || !body.password) {
    throw new BadRequestError("Email and password are required");
  }

  const isAuthCheck: any = await userService.findByEmail(body.email);

  //console.log(isAuthCheck);

  if (!isAuthCheck) throw new NotFoundError("Invalid email!");

  //compare password
  const isPasswordMatch = await userUtil.comparePassword(
    body.password,
    isAuthCheck.password
  );

  //console.log(isPasswordMatch);

  if (!isPasswordMatch) throw new BadRequestError("Invalid password!");

  //console.log(isAuthCheck.user);

  const token = userUtil.signToken(isAuthCheck);

  let user = {
    fullName: isAuthCheck.fullName,
    email: isAuthCheck.email,
    role: isAuthCheck.role,
  };

  CustomResponse(res, true, StatusCodes.OK, "Log in successfully!", {
    token,
    user: user,
  });
};

const GetUserProfile = async (req: Request, res: Response) => {
  const auth: any = req.auth;

  //console.log(auth);

  const user = await userService.findById(auth._id);

  //console.log(user + "====");

  if (!user) {
    throw new NotFoundError("User not found!");
  }

  return CustomResponse(
    res,
    true,
    StatusCodes.OK,
    "Profile fetched successfully!",
    user
  );
};

const GetAllUsers = async (req: Request, res: Response) => {
  const auth: any = req.auth;

  const user = await userService.findById(auth._id);

  if (!user) {
    throw new NotFoundError("User not found!");
  }

  const users = await userService.getAllUsers();

  return CustomResponse(
    res,
    true,
    StatusCodes.OK,
    "All Users fetched successfully!",
    users
  );
};

const EditUserDetails = async (req: Request, res: Response) => {
  const auth: any = req.auth;

  const user = await userService.findById(auth._id);

  if (!user) {
    throw new NotFoundError("User not found!");
  }

  const userId = auth._id;
  const updatedDetails = req.body;

  const updatedUser = await userService.editUserDetails(userId, updatedDetails);

  return CustomResponse(
    res,
    true,
    StatusCodes.OK,
    "Edit User successfully!",
    updatedUser
  );
};

const SendVerificationCode = async (req: Request, res: Response) => {
  const { email } = req.body;

  const verificationCode = Math.floor(1000 + Math.random() * 9000);

  const subject = "Password Reset Verification Code";
  const htmlBody = emailService.VerificationCodeEmail(verificationCode);

  // Send email to the user's email address
  await sendEmail(email, subject, htmlBody, null);

  return CustomResponse(
    res,
    true,
    StatusCodes.OK,
    "Verification code sent successfully!",
    { verificationCode }
  );
};

const ResetPassword = async (req: Request, res: Response) => {
  const { email, newPassword } = req.body;

  try {
    const updatedUser = await userService.resetPassword(email, newPassword);

    // console.log("-------------" + updatedUser);

    return CustomResponse(
      res,
      true,
      StatusCodes.OK,
      "Password changed successfully!",
      { changed: true }
    );
  } catch (error: any) {
    // Handle errors here
    console.error(error);
  }
};

const EditUserDetailsUserId = async (req: Request, res: Response) => {
  const auth: any = req.auth;
  const userId: any = req.params.userId;

  // console.log(userId);

  const user = await userService.findById(auth._id);

  if (!user) {
    throw new NotFoundError("User not found!");
  }

  const updatedDetails = req.body;

  const updatedUser = await userService.editUserDetails(userId, updatedDetails);

  return CustomResponse(
    res,
    true,
    StatusCodes.OK,
    "Edit User successfully!",
    updatedUser
  );
};

export {
  RegisterUser,
  GetUserProfile,
  GetAllUsers,
  EditUserDetails,
  EditUserDetailsUserId,
  ResetPassword,
  SendVerificationCode,
  UserLogin,
};
