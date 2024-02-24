"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Data = exports.UserLogin = exports.SendVerificationCode = exports.ResetPassword = exports.EditUserDetailsUserId = exports.EditUserDetails = exports.GetAllUsers = exports.GetUserProfile = exports.RegisterUser = void 0;
const user_utill_1 = __importDefault(require("../utills/user-utill"));
const user_service_1 = __importDefault(require("../services/user-service"));
const user_model_1 = __importDefault(require("../models/user-model"));
//import Auth from "../auth/auth.model";
const http_status_codes_1 = require("http-status-codes");
const mongoose_1 = require("mongoose");
const responce_1 = __importDefault(require("../utills/responce"));
const email_server_1 = require("../utills/email/email-server");
const email_templates_1 = __importDefault(require("../utills/email/email-templates"));
// Import custom errors
const NotFoundError_1 = __importDefault(require("../utills/error/error.classes/NotFoundError"));
const BadRequestError_1 = __importDefault(require("../utills/error/error.classes/BadRequestError"));
// const RegisterUser = async (req: Request, res: Response) => {
//   console.log("Hello Hello");
// };
const RegisterUser = async (req, res) => {
    const body = req.body;
    const user = new user_model_1.default(body.user);
    //console.log(user.email);
    const existingUser = await user_service_1.default.findByEmail(user.email);
    if (existingUser) {
        throw new BadRequestError_1.default("User already exists!");
    }
    /*
    const auth = new Auth();
    auth._id = user.email;
    auth.password = await userUtil.hashPassword(body.user.password);
    auth.user = user._id;
    */
    let createdUser = null;
    const session = await (0, mongoose_1.startSession)();
    try {
        session.startTransaction();
        createdUser = await user_service_1.default.save(user, session);
        console.log(createdUser);
        if (createdUser != null) {
            // Prepare and send email content
            const subject = "Register Success";
            const htmlBody = email_templates_1.default.UserRegisteredEmail({
                fullName: createdUser.firstname + " " + createdUser.lastname,
            });
            await (0, email_server_1.sendEmail)(user.email, subject, htmlBody, null);
        }
        //await userService.save(auth, session);
        await session.commitTransaction();
    }
    catch (e) {
        await session.abortTransaction();
        throw e;
    }
    finally {
        //end session
        session.endSession();
    }
    return (0, responce_1.default)(res, true, http_status_codes_1.StatusCodes.CREATED, "User registered successfully!", createdUser);
};
exports.RegisterUser = RegisterUser;
const Data = async (req, res) => {
    //const auth: any = req.auth;
    //console.log(auth);
    // const user = await userService.findById(auth._id);
    // //console.log(user + "====");
    // if (!user) {
    //   throw new NotFoundError("User not found!");
    // }
    return (0, responce_1.default)(res, true, http_status_codes_1.StatusCodes.OK, "Profile fetched successfully!", "hello");
};
exports.Data = Data;
const UserLogin = async (req, res) => {
    const body = req.body;
    if (!body.email || !body.password) {
        throw new BadRequestError_1.default("Email and password are required");
    }
    const isAuthCheck = await user_service_1.default.findByEmail(body.email);
    if (!isAuthCheck)
        throw new NotFoundError_1.default("Invalid email!");
    //compare password
    const isPasswordMatch = await user_utill_1.default.comparePassword(body.password, isAuthCheck.password);
    if (!isPasswordMatch)
        throw new BadRequestError_1.default("Invalid password!");
    //get user
    const populateUser = await isAuthCheck.populate("user");
    const token = user_utill_1.default.signToken(populateUser.user);
    let user = {
        fullName: populateUser.user.fullName,
        email: populateUser.user.email,
        role: populateUser.user.role,
    };
    (0, responce_1.default)(res, true, http_status_codes_1.StatusCodes.OK, "Log in successfully!", {
        token,
        user: user,
    });
};
exports.UserLogin = UserLogin;
const GetUserProfile = async (req, res) => {
    const auth = req.auth;
    //console.log(auth);
    const user = await user_service_1.default.findById(auth._id);
    //console.log(user + "====");
    if (!user) {
        throw new NotFoundError_1.default("User not found!");
    }
    return (0, responce_1.default)(res, true, http_status_codes_1.StatusCodes.OK, "Profile fetched successfully!", user);
};
exports.GetUserProfile = GetUserProfile;
const GetAllUsers = async (req, res) => {
    const auth = req.auth;
    const user = await user_service_1.default.findById(auth._id);
    if (!user) {
        throw new NotFoundError_1.default("User not found!");
    }
    const users = await user_service_1.default.getAllUsers();
    return (0, responce_1.default)(res, true, http_status_codes_1.StatusCodes.OK, "All Users fetched successfully!", users);
};
exports.GetAllUsers = GetAllUsers;
const EditUserDetails = async (req, res) => {
    const auth = req.auth;
    const user = await user_service_1.default.findById(auth._id);
    if (!user) {
        throw new NotFoundError_1.default("User not found!");
    }
    const userId = auth._id;
    const updatedDetails = req.body;
    const updatedUser = await user_service_1.default.editUserDetails(userId, updatedDetails);
    return (0, responce_1.default)(res, true, http_status_codes_1.StatusCodes.OK, "Edit User successfully!", updatedUser);
};
exports.EditUserDetails = EditUserDetails;
const SendVerificationCode = async (req, res) => {
    const { email } = req.body;
    const verificationCode = Math.floor(1000 + Math.random() * 9000);
    const subject = "Password Reset Verification Code";
    const htmlBody = email_templates_1.default.VerificationCodeEmail(verificationCode);
    // Send email to the user's email address
    await (0, email_server_1.sendEmail)(email, subject, htmlBody, null);
    return (0, responce_1.default)(res, true, http_status_codes_1.StatusCodes.OK, "Verification code sent successfully!", { verificationCode });
};
exports.SendVerificationCode = SendVerificationCode;
const ResetPassword = async (req, res) => {
    const { email, newPassword } = req.body;
    try {
        const updatedUser = await user_service_1.default.resetPassword(email, newPassword);
        // console.log("-------------" + updatedUser);
        return (0, responce_1.default)(res, true, http_status_codes_1.StatusCodes.OK, "Password changed successfully!", { changed: true });
    }
    catch (error) {
        // Handle errors here
        console.error(error);
    }
};
exports.ResetPassword = ResetPassword;
const EditUserDetailsUserId = async (req, res) => {
    const auth = req.auth;
    const userId = req.params.userId;
    // console.log(userId);
    const user = await user_service_1.default.findById(auth._id);
    if (!user) {
        throw new NotFoundError_1.default("User not found!");
    }
    const updatedDetails = req.body;
    const updatedUser = await user_service_1.default.editUserDetails(userId, updatedDetails);
    return (0, responce_1.default)(res, true, http_status_codes_1.StatusCodes.OK, "Edit User successfully!", updatedUser);
};
exports.EditUserDetailsUserId = EditUserDetailsUserId;
