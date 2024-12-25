import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js"

export const signup = async (req,res) => {
    const{fullName, email, password} = req.body
    try {
        //hash Mật Khẩu
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields are required"});
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters"});
        }

        const user = await User.findOne({email})

        if (user) return res.status(400).json({ message: "Email already exists"});

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt)

        const newUser = new User({
            fullName,
            email: email,
            password:hashedPassword
        })

        if(newUser) {
            generateToken(newUser._id, res);
            await newUser.save();

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,
            });
        } else {
            res.status(400).json({ message: "Invalid user data" });
        }
    } catch (error) {
        console.log("Error in signup controller", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
  
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
  
      generateToken(user._id, res);
  
      res.status(200).json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePic: user.profilePic,
      });
    } catch (error) {
      console.log("Error in login controller", error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
  
export const logout = (req, res) => {
    try {
      res.cookie("jwt", "", { maxAge: 0 });
      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      console.log("Error in logout controller", error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    // Validate base64 image format
    if (!profilePic.startsWith('data:image')) {
      return res.status(400).json({ message: "Invalid image format" });
    }

    // Add error handling for cloudinary upload with proper configuration
    let uploadResponse;
    try {
      uploadResponse = await cloudinary.uploader.upload(profilePic, {
        folder: "chat_app", // Specify folder in cloudinary
        resource_type: "auto", // Allow automatic format detection
        allowed_formats: ["jpg", "png", "jpeg", "gif"],
        transformation: [
          { width: 800, height: 800, crop: "limit" },
          { quality: "auto" }
        ]
      });
    } catch (uploadError) {
      console.log("Cloudinary upload error:", uploadError);
      return res.status(400).json({ 
        message: "Image upload failed", 
        error: uploadError.message 
      });
    }

    // Update user profile with better error handling
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePic: uploadResponse.secure_url },
        { new: true, select: "-password" }
      );

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        profilePic: updatedUser.profilePic,
      });

    } catch (dbError) {
      console.log("Database update error:", dbError);
      return res.status(500).json({ 
        message: "Failed to update user profile",
        error: dbError.message 
      });
    }

  } catch (error) {
    console.log("Error in update profile:", error);
    res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

export const checkAuth = (req, res) => {
    try {
      res.status(200).json(req.user);
    } catch (error) {
      console.log("Error in checkAuth controller", error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
};

  