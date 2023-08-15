import AppError from "../utilities/error.util.js";
import jwt from "jsonwebtoken";

const isLoggedIn = (req, res, next) => {
    const token = (req.cookies && req.cookies.token) || null;

    if (!token) {
        return next(new AppError('Not authorized, please login again', 401));
    }

    try {
        const userDetails = jwt.verify(token, process.env.JWT_SECRET);
        req.user = userDetails;
        next();
    } catch (error) {
        return next(new AppError('Token verification failed', 401));
    }
}

const authorizedRole = (...roles) => async(req, res, next) => {
    const currentRole = req.user.role;

    if (!roles.includes(currentRole)) {
        return next(new AppError("you donot have permission to access this route", 403));
    }

    next();
}

const authorizeSubscribers = async (req, res, next) => {
    const currentRole = req.user.role;
    const subscription = req.user.subscription;

    if (currentRole !== "ADMIN" && subscription !== "active") {
        return next(new AppError("subscribe to the course to access it!", 403));
    }

    next();
}

export {
    isLoggedIn,
    authorizedRole,
    authorizeSubscribers
} 