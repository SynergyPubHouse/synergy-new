const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Generate JWT
const generateToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: "30d",
	});
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
	const {
		title,
		firstName,
		middleName,
		lastName,
		email,
		username,
		password,
	} = req.body;

	try {
		const existingUser = await User.findOne({
			$or: [{ email }, { username }],
		});

		if (existingUser) {
			return res
				.status(400)
				.json({ message: "Username or Email already exists" });
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const newUser = await User.create({
			title,
			firstName,
			middleName,
			lastName,
			email,
			username,
			password: hashedPassword,
		});

		if (newUser) {
			res.status(201).json({
				_id: newUser._id,
				title: newUser.title,
				firstName: newUser.firstName,
				lastName: newUser.lastName,
				email: newUser.email,
				username: newUser.username,
				token: generateToken(newUser._id),
			});
		}
	} catch (error) {
		res.status(500).json({ message: "Server Error", error });
	}
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
	const { email, password } = req.body;

	try {
		const user = await User.findOne({ email });

		if (user && (await bcrypt.compare(password, user.password))) {
			res.json({
				_id: user._id,
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
				username: user.username,
				token: generateToken(user._id),
			});
		} else {
			res.status(401).json({ message: "Invalid email or password" });
		}
	} catch (error) {
		res.status(500).json({ message: "Server Error", error });
	}
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select("-password");

		if (user) {
			res.json(user);
		} else {
			res.status(404).json({ message: "User not found" });
		}
	} catch (error) {
		res.status(500).json({ message: "Server Error", error });
	}
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);

		if (user) {
			user.firstName = req.body.firstName || user.firstName;
			user.middleName = req.body.middleName || user.middleName;
			user.lastName = req.body.lastName || user.lastName;
			user.email = req.body.email || user.email;
			user.username = req.body.username || user.username;

			if (req.body.password) {
				user.password = await bcrypt.hash(req.body.password, 10);
			}

			const updatedUser = await user.save();

			res.json({
				_id: updatedUser._id,
				firstName: updatedUser.firstName,
				lastName: updatedUser.lastName,
				email: updatedUser.email,
				username: updatedUser.username,
				token: generateToken(updatedUser._id),
			});
		} else {
			res.status(404).json({ message: "User not found" });
		}
	} catch (error) {
		res.status(500).json({ message: "Server Error", error });
	}
};

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
	try {
		const users = await User.find({}).select("-password");
		res.json(users);
	} catch (error) {
		res.status(500).json({ message: "Server Error", error });
	}
};

// @desc    Delete user
// @route   DELETE /api/auth/user/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
	try {
		const user = await User.findById(req.params.id);

		if (user) {
			await user.remove();
			res.json({ message: "User removed" });
		} else {
			res.status(404).json({ message: "User not found" });
		}
	} catch (error) {
		res.status(500).json({ message: "Server Error", error });
	}
};

// @desc    Verify if email exists in database
// @route   POST /api/auth/verify-email
// @access  Private
exports.verifyEmail = async (req, res) => {
	try {
		const { email } = req.body;

		if (!email) {
			return res.status(400).json({ message: "Email is required" });
		}

		const user = await User.findOne({ email });

		if (user) {
			res.json({ 
				exists: true,
				message: "Email exists in database",
				user: {
					_id: user._id,
					title: user.title,
					firstName: user.firstName,
					middleName: user.middleName,
					lastName: user.lastName,
					email: user.email,
					institution: user.institution,
					country: user.country,
					academicDegree: user.academicDegree
				}
			});
		} else {
			res.json({ 
				exists: false,
				message: "Email does not exist in database" 
			});
		}
	} catch (error) {
		res.status(500).json({ message: "Server Error", error: error.message });
	}
};
