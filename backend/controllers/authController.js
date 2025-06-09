const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const User = require("../models/User");
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

exports.googleAuth = async (req, res) => {
  try {
    const { token } = req.body;
    
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists
    let user = await User.findOne({ 
      $or: [
        { email },
        { googleId }
      ]
    });

    if (!user) {
      // Create new user with Google info
      user = await User.create({
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' '),
        email,
        googleId,
        username: email.split('@')[0] + '_' + googleId.slice(0, 4),
        password: await bcrypt.hash(googleId + process.env.JWT_SECRET, 10),
        isVerified: true
      });
    } else if (!user.googleId) {
      // Update existing user with Google ID
      user.googleId = googleId;
      await user.save();
    }

    // Generate JWT
    const authToken = generateToken(user._id);

    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      token: authToken
    });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ 
      message: 'Google authentication failed',
      error: error.message 
    });
  }
};

exports.getGoogleClientId = async (req, res) => {
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID });
};

// @desc    Handle ORCID OAuth callback
// @route   POST /api/auth/orcid/callback
// @access  Public
exports.orcidCallback = async (req, res) => {
    try {
        const { code } = req.body;
        
        // Debug logging
        console.log('ORCID Client ID:', process.env.ORCID_CLIENT_ID);
        console.log('ORCID Client Secret:', process.env.ORCID_CLIENT_SECRET ? 'Secret is set' : 'Secret is not set');
        console.log('Authorization Code:', code);

        if (!process.env.ORCID_CLIENT_ID || !process.env.ORCID_CLIENT_SECRET) {
            console.error('Missing ORCID credentials in environment variables');
            return res.status(500).json({ 
                message: 'ORCID configuration error',
                error: 'Missing ORCID credentials'
            });
        }

        // Exchange authorization code for access token
        const tokenResponse = await axios.post(
            'https://orcid.org/oauth/token',
            `client_id=${process.env.ORCID_CLIENT_ID}&client_secret=${process.env.ORCID_CLIENT_SECRET}&grant_type=authorization_code&code=${code}&redirect_uri=https://www.synergyworldpress.com/orcid-callback`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const { access_token, orcid } = tokenResponse.data;

        // Get user information from ORCID
        const userResponse = await axios.get(`https://api.orcid.org/v3.0/${orcid}/person`, {
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            }
        });

        const orcidData = userResponse.data;
        const email = orcidData.emails?.[0]?.email;
        const name = orcidData.name;

        if (!email) {
            return res.status(400).json({ message: "No email found in ORCID profile" });
        }

        // Check if user exists
        let user = await User.findOne({
            $or: [
                { email },
                { orcidId: orcid }
            ]
        });

        if (!user) {
            // Create new user with ORCID info
            user = await User.create({
                firstName: name['given-names']?.value || name.givenNames,
                lastName: name['family-name']?.value || name.familyName,
                email,
                orcidId: orcid,
                username: email.split('@')[0] + '_' + orcid.slice(-4),
                password: await bcrypt.hash(orcid + process.env.JWT_SECRET, 10),
                isVerified: true
            });
        } else if (!user.orcidId) {
            // Update existing user with ORCID ID
            user.orcidId = orcid;
            await user.save();
        }

        res.json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            username: user.username,
            orcidId: user.orcidId,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error('ORCID callback error:', error);
        res.status(500).json({ message: 'ORCID authentication failed', error: error.message });
    }
};