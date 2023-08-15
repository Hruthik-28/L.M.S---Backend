import { Schema, model } from "mongoose";

const PaymentSchema = new Schema({
    razorpay_payment_id: {
        type: String,
        required: [true, "razorpay_payment_id is required"]
    },
    razorpay_subscription_id: {
        type: String,
        required: [true, "razorpay_subscription_id is required"]
    },
    razorpay_signature: {
        type: String,
        required: [true, "razorpay_signature is required"]
    }

},{
    timestamps: true
});

const Payment = model("Payment", PaymentSchema);
export default Payment;