import { Request, Response } from "express";
import { User } from "../models/userModels";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../middleware/authMiddleware";
import { Post } from "../models/postModels";
import { uploadImagesCloudinary } from "../utils/cloudinary";
import { populate } from "dotenv";

export const signUp = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: "All fields are required",
      });
      return;
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "Email already exists",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const signIn = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "All fields are required",
      });
      return;
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: "Invalid password",
      });
      return;
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "7d",
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "none",
      secure: true, // production এ true
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });

    res.status(200).json({
      success: true,
      message: "User signed in successfully",
      user,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const profile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId)
      .select("-password")
      .populate({
        path: "post",
        populate: {
          path: "author",
          select: "name profilePic",
        },
      })
      .populate({
        path: "bookmark",
        populate: {
          path: "author",
          select: "name profilePic",
        },
      });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "UnAuthorized user",
      });
    }
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const otherProfile = async (req: Request, res: Response) => {
  const userId = req.params.id;
  try {
    const user = await User.findById(userId)
      .select("-password")
      .populate({
        path: "post",
        populate: {
          path: "author",
          select: "name profilePic",
        },
      })
      .populate({
        path: "bookmark",
        populate: {
          path: "author",
          select: "name profilePic",
        },
      });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User is not found",
      });
    }
    return res.status(201).json({
      success: true,
      message: "User profile received successFully",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updatedProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { name, bio } = req.body;
    const file = req.file?.path;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "UnAuthorized user",
      });
    }
    if (name) user.name = name;
    if (bio) user.bio = bio;
    if (file) {
      const cloudImage = await uploadImagesCloudinary(file, "profileImg");
      if (cloudImage) {
        user.profilePic = cloudImage;
      }
    }
    await user.save();

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const followUnFollowing = async (req: AuthRequest, res: Response) => {
  const localUserId = req.userId;
  const otherUserId = req.params.id;

  try {
    if (!localUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (localUserId === otherUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    const user = await User.findById(localUserId);
    const otherUser = await User.findById(otherUserId);

    if (!user || !otherUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ use some()
    const isFollowing = user.following.some(
      (id) => id.toString() === otherUserId
    );

    if (!isFollowing) {
      user.following.push(otherUserId as any);
      otherUser.follower.push(localUserId as any);
    } else {
      user.following = user.following.filter(
        (id) => id.toString() !== otherUserId
      );

      otherUser.follower = otherUser.follower.filter(
        (id) => id.toString() !== localUserId
      );
    }

    await user.save();
    await otherUser.save();

    return res.status(200).json({
      success: true,
      message: isFollowing ? "Unfollowed" : "Followed",
      followed: !isFollowing,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const bookmark = async (req: AuthRequest, res: Response) => {
  const postId = req.params.id;
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "unAuthorized user",
      });
    }
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(401).json({
        success: false,
        message: "Post is not found",
      });
    }
    const isBookmarking = await user.bookmark.some(
      (id) => id.toString() === postId
    );
    if (!isBookmarking) {
      user.bookmark.push(postId as any);
    } else {
      user.bookmark = user.bookmark.filter((id) => id.toString() !== postId);
    }
    await user.save();
    return res.status(201).json({
      success: true,
      message: isBookmarking ? "removed" : "bookmarking",
      bookmarked: isBookmarking,
    });
  } catch (error) { }
};

export const getSuggestedUsers = async (req: AuthRequest, res: Response) => {
  try {
    const myId = req.userId;

    if (!myId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const me = await User.findById(myId);

    if (!me) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 🔥 get users except me and already followed users
    const users = await User.find({
      _id: {
        $ne: myId,
        $nin: me.following, // exclude already following
      },
    })
      .select("name username profile")
      .limit(10);

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
