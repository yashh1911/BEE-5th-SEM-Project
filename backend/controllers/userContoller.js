import User from "../model/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = "mykey"

export async function registerController(req, res) {
    const { username, email, password, type } = req.body;

   if(!username || !email || !password){
    return res.status(400).json({ success: false, message: "Username, email and password are required" });
   }

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(409).json({ success: false, message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            type
        });

        await newUser.save();

        return res.status(201).json({ success: true, message: "User registered successfully", user: { username, email, type } });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

export async function loginController(req, res) {
  const { email, password } = req.body;
  if(!email || !password){
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        username: user.username,
        email: user.email,
        type: user.type
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

