import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";
import { razorpay } from "../server.js";
import AppError from "../utilities/error.util.js";
import crypto from "crypto";

export const getRazorpayApiKey = async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            message: "getRazorpayApiKey successfull",
            key: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        return next(new AppError(error.message, 400));
    }
}
export const buySubscription = async (req, res, next) => {
    try {
        const { id } = req.user;
        console.log(id);

        const user = User.findById(id);
    
        if (!user) {
            return next(new AppError("unauthorized, please login again", 400));
        }
    
        if (user.role === "ADMIN") {
            return next(new AppError("admin cannnot subscribe", 400));
        }
    
        const subscription = await razorpay.subscriptions.create({
            plan_id: process.env.RAZORPAY_PLAN_ID,
            customer_notify: 1
        });
    
        user.subscription.id = subscription.id;
        user.subscription.status = subscription.status;
    
        user.save();
    
        res.status(200).json({
            success: true,
            message: "subscribed successfully",
            subscription_id: subscription.id
        });
    } catch (error) {
        return next(new AppError(error.message, 400));
    }
}
export const verifySubscription = async (req, res, next) => {
    try {
        const { id } = req.user.id;
        const {razorpay_payment_id, razorpay_subscription_id, razorpay_signature} = req.body;
    
        const user = User.findById(id);
        if (!user) {
            return next(new AppError("unauthorized, please login again", 400));
        }
        const subscriptionId = user.subscription.id;
    
        const generatedSignature = await crypto
            .Hmac('sha256', process.env.RAZORPAY_SECRET)
            .update(`${razorpay_payment_id} | ${subscriptionId}`)
            .digest('hex')
        ;
    
        if (!(generatedSignature === razorpay_signature)) {
            return next(new AppError("payment verification failed, please login again", 500));
        }
    
        await Payment.create({
            razorpay_payment_id,
            razorpay_subscription_id,
            razorpay_signature
        });
    
        user.subscription.status = 'active';
        await user.save()
    
        res.status(200).json({
            success: true,
            message: 'payment verification successfull!',
        });
    } catch (error) {
        return next(new AppError(error.message, 400));
    }
}
export const cancelSubscription = async (req, res, next) => {
    try {
        const { id } = req.user;

        const user = await User.findById(id);
        if (!user) {
            return next(new AppError("unauthorized, please login again"), 400);
        }
        if (user.role === "ADMIN") {
            return next(new AppError("admin cannnot subscribe", 400));
        }

        const subscriptionId = user.subscription.id;

        const subscription = await razorpay.subscriptions.cancel(subscriptionId);
    
        user.subscription.status = subscription.status;
    
        await user.save();
    
        res.status(200).json({
            success: true,
            message: "subscription cancelled successfully"
        });
    } catch (error) {
        return next(new AppError(error.message, 400));
    }
}
export const allPayment = async (req, res, next) => {
    try {
        const { count } = req.query;

        const subscriptions = await razorpay.subscriptions.all({
            count: count || 10        
        });

        res.status(200).json({
            success: true,
            message: "All payments record",
            subscriptions: subscriptions
        })
    } catch (error) {
        return next(new AppError(error.message, 400));
    }
}

