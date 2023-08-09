import {mongoose, model, Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new Schema({
    fullName: {
        type: String,
        required: [true, 'Name is required'],
        minLength: [5, 'Name must be atleast 5 characters'],
        maxLength: [50, 'Name must be less than 50 characters'],
        lowercase: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        unique: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']

    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minLength: [8, 'Name Password be 8 characters'],
        select: false
    },
    avatar: {
        public_id: {
            type: String,
        },
        secure_url: {
            type: String,
        }
    },
    forgotPasswordToken: {
        type: String
    },
    forgotPasswordExpiry: {
        type: Date
    },
    role: {
        type: String,
        enum: ['USER', 'ADMIN'],
        default: 'USER'
    }
}, {
    timestamps: true
});

userSchema.pre("save", async function(next) {
    if (!this.isModified('password')) {
        return next();
    }

    this.password = await bcrypt.hash(this.password, 10);
    return next();
})

userSchema.methods = {
    generateJWTToken:  function () {
        return jwt.sign(
            {
                id: this._id,
                email: this.email,
                subscription: this.subscription,
                role: this.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '7d'
            }
        );
    },
    comparePassword: async function(plainTextPassword) {
        return await bcrypt.compare(plainTextPassword, this.password);
    },
    generatePasswordResetToken: async function() {
        const resetToken = crypto.randomBytes(20).toString('hex');

        this.forgotPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex')
        ;
        this.forgotPasswordExpiry = Date.now() + 15 * 60 * 1000; // 15min from now

        return resetToken;
    }
}

const User = model("User", userSchema);

export default User;