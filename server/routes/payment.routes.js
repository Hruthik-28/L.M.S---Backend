import {Router} from "express"
import { allPayment, buySubscription, cancelSubscription, getRazorpayApiKey, verifySubscription } from "../controllers/payment.controller.js";
import { authorizedRole, isLoggedIn } from "../middlewares/auth.middleware.js";

const router = Router();

router
    .route('/razorpay-key')
    .get(isLoggedIn, getRazorpayApiKey)
;
router
    .route('/subscribe')
    .post(isLoggedIn, buySubscription)
;
router.
    route('/verify')
    .post(isLoggedIn, verifySubscription)
;
router.
    route('/unsubscribe')
    .post(isLoggedIn, cancelSubscription)
;
router.
    route('/')
    .post(isLoggedIn, authorizedRole("ADMIN"), allPayment)
;

export default router;