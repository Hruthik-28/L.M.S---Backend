import { token } from "morgan";
import User from "../models/user.model.js";
import AppError from "../utilities/error.util.js";
import bcrypt from "bcrypt";
import cloudinary from "cloudinary";
import fs from "fs/promises";
import sendEmail from "../utilities/send.Email.util.js";
import crypto from "crypto";

const cookieOptions = {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpsOnly: true,
    secure: false
}

const register = async(req, res, next) => {
    const {fullName, email, password} = req.body;

    if (!fullName || !email || !password) {
        return next(new AppError("All fields are requires", 400));
    }

    const userExists = await User.findOne({email});

    if (userExists) {
        return next(new AppError("Email already exists"), 400);
    }

    const user = await User.create({
        fullName,
        email,
        password,
        avatar: {
            public_id: email,
            secure_url: "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.pinterest.com%2Fpin%2F494129390368005730%2F&psig=AOvVaw29IgsoPqE99BbAw4NCHPQ9&ust=1691246132494000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCLiX4fmcw4ADFQAAAAAdAAAAABAE"
        }
    })

    if (!user) {
        return next(new AppError("user registration failed, please try again"), 400);

    }

    // FILE UPLOAD
    // console.log("file details:", JSON.stringify(req.file));
    if (req.file) {
        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'lms',
                width: 250,
                height: 250,
                gravity: 'faces',
                crop: 'fill'
            });

            if (result) {
                user.avatar.public_id = result.public_id;
                user.avatar.secure_url = result.secure_url;

                // Remove file from server
                fs.rm(`uploads/${req.file.filename}`)
            }
        } catch (error) {
            return next(new AppError(error.message, 500))
        }
    }

    await user.save();

    user.password = undefined;

    const token = user.generateJWTToken();

    res.cookie('token', token, cookieOptions);

    res.status(200).json({
        success: true,
        message: "User registered successfully",
        user
    });
}

const login = async(req, res, next) => {
    const {email, password} = req.body;

    try {
        if (!email || !password) {
            return next(new AppError("All fields are required", 400));
        }
    
        const user = await User.findOne({
            email
        }).select('+password');
    
        if(!user || !(await bcrypt.compare(password, user.password))){//user.comparePassword(password)
            return next(new AppError("Email or password doesn't match"), 400);
        }
    
        const token = user.generateJWTToken();
        user.password = undefined;
    
        res.cookie('token', token, cookieOptions);
    
        res.status(200).json({
            success: true,
            message: "user login successfull",
            user,
            token
        })
    } catch (error) {
        return next(new AppError(error.message), 400);
    }


}

const logout = async(req, res, next) => {
    try {
        res.cookie('token', {
            secure: true,
            maxAge: 0,
            httpOnly: true
        });
    
        res.status(200).json({
            success: true,
            message: "Logout Successfull"
        })
    } catch (error) {
        return next(new AppError("Logout failed"), 400);
    }
}

const getProfile = async(req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        res.status(200).json({
            success: true,
            message: 'user details',
            user,
        })
    } catch (error) {
        return next(new AppError("Failed to fetch profile details"), 400)
    }
}

const forgotPassword = async(req, res, next) => {
    const {email} = req.body;
    if (!email) {
        return next(new AppError("Enter your email", 400));
    }

    const user = await User.findOne({email});

    if (!user) {
        return next(new AppError("Email not registered", 400));
    }

    const resetToken = await user.generatePasswordResetToken();
    // console.log("PasswordResetToken:", resetToken);

    await user.save();

    const resetPasswordURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const subject = 'Reset Password';
    const message = `<a href = ${resetPasswordURL} target = "_blank"> Reset your password</a>\n If the above link doesnot work <a href = ${resetPasswordURL}> click here. </a> `;
    try {
        await sendEmail(email, subject, message);

        res.status(200).json({
            success: true,
            message: `Reset password token has been send to ${email} sucessfully` ,
        })
    } catch (err) {
        user.forgotPasswordExpiry = undefined;
        user.forgotPasswordToken = undefined;

        await user.save();
        return next(new AppError(err.message, 400));
    }

}

const resetPassword = async(req, res, next) => {
    const {resetToken} = req.params;

    const {password} = req.body;

    const forgotPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')
    ;

    const user = await User.findOne({
        forgotPasswordToken,
        forgotPasswordExpiry: {$gt: Date.now()}
    });

    if (!user) {
        return next(new AppError("Token is invalid or expired, please try again", 400));
    }

    user.password = password;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    user.save();

    res.status(200).json({
        success: true,
        message: "password changed successfully"
    })


}

const changePassword = async(req, res, next) => {
    const {oldPassword, newPassword} = req.body;
    const userId = req.user.id;

    if (!oldPassword, !newPassword) {
        return next(new AppError("all fields are required", 400));
    }

    const user = await User.findById(userId).select("+password");

    if (!user) {
        return next(new AppError("user doesnt exist", 400));
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordValid) {
        return next(new AppError("Invalid old password", 400));
    }

    user.password = newPassword;
    await user.save();

    user.password = undefined;

    res.status(200).json({
        success: true,
        message: "password changed successfully",
        user
    });
}

const updateUser = async(req, res, next) => {
    const {fullName, avatar} = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
        return next(new AppError("User does not exist", 400));
    }

    if (req.fullName) {
        user.fullName = fullName;
    }

    if (req.file) {
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);
        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'lms',
                width: 250,
                height: 250,
                gravity: 'faces',
                crop: 'fill'
            });

            if (result) {
                user.avatar.public_id = result.public_id;
                user.avatar.secure_url = result.secure_url;

                // Remove file from server
                fs.rm(`uploads/${req.file.filename}`)
            }
        } catch (error) {
            return next(new AppError(error.message, 500))
        }

        user.save();

        res.status(200).json({
            success: true,
            message: "user details updated successfully"
        })
    }
}

export {
    register,
    login,
    logout,
    getProfile,
    forgotPassword,
    resetPassword,
    changePassword,
    updateUser
}