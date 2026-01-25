import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please provide a username"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
    },

    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      match: [
        /^[A-Za-z0-9._%+-]+@[/^[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
        "Please provide a valid email",
      ],
    },

    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false,
    },

    profileImage: {
      type: String,
      default: null,
    },

    roles: {
      type: [String],
      enum: ["user", "admin"],
      default: ["user"]
    }
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
