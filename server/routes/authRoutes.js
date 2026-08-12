
const express = require("express");
const router = express.Router();

const auth = require('../controllers/authController');
 
router.post('/register', validateSchema(registerSchema), auth.register);
router.post('/login',    validateSchema(loginSchema),    auth.login);
 
module.exports = router;
 
