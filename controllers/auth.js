import { pool } from "../database/db_connection.js";
import bcrypt from "bcryptjs";
import JWT from "jsonwebtoken";

export const authController = {};

function signJWT(user) {
	return JWT.sign(
		{
			id: user.id,
			role: user.role,
		},
		process.env.JWT_SECRET,
		{
			expiresIn: process.env.JWT_EXP,
		},
	);
}

/**
 * Register a new user (customer)
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
authController.signup = async (req, res, next) => {
	const { f_nme, l_nme, user_eml, phne_num, user_pw } = req.body;

	// check if user already exist
	const [userCheck] = await pool.query(
		`
            SELECT COUNT(*) AS user_count 
            FROM users 
            WHERE email = ?   
        `,
		[user_eml],
	);

	if (!userCheck.user_count) {
		// hash user password for safe storage in database
		const hashed_pw = await bcrypt.hashSync(user_pw);
		// create user account if email isnt already registered
		const newUser = await pool.query(
			`
            INSERT INTO users (first_name, last_name, email, phone_num, password, role) 
            VALUES (?, ?, ?, ?, ?, ?)
            `,
			[f_nme, l_nme, user_eml, phne_num, hashed_pw, "CUSTOMER"],
		);

		if (!newUser)
			return res.status(400).json({
				status: "error",
				message: "Failed to create user account",
			});

		const user = {
			id: newUser.insertId,
			f_nme,
			l_nme,
			user_eml,
			phne_num,
			role: "CUSTOMER",
		};

		return res.status(202).json({
			status: "success",
			data: { user },
		});
	}
};

/**
 * Login user
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
authController.login = async (req, res, next) => {
	const { user_eml, user_pw } = req.body;

	// check if user account exist
	const [userAcc] = await pool.query(
		`
            SELECT * FROM users 
            WHERE email = ? 
        `,
		[user_eml],
	);

	console.log("USER ACCOUNT: ", userAcc);

	if (!userAcc)
		// if account not found return appropriate error message
		return res.status(404).json({
			status: "error",
			message: "User account not found",
		});

	// else if account exist compare saved password and password entered
	if (!(await bcrypt.compareSync(user_pw, userAcc[0].password)))
		// if password doesnt match return error message
		return res.status(400).json({
			status: "error",
			message: "Incorrect password",
		});

	// if password match sign jwt and return data
	const token = signJWT(userAcc[0]);
	userAcc[0].password = undefined;

	return res.status(200).json({
		status: "success",
		data: {
			token,
			user: userAcc,
		},
	});
};

authController.authenticate = async (req, res, next) => {
	const authorization = req.get("Authorization");
	// console.log("TOKEN: ", authorization);

	// checks authorization starts with "Bearer", and returns error with a message if not
	if (!authorization?.startsWith("Bearer")) {
		return next(
			res.status(400).json({
				status: "error",
				message: "Unauthorized! Please login to access content",
			}),
		);
	}

	// if authorization starts with key word: 'Bearer' then it split the string and the part with the  token
	const token = authorization.split(" ")[1];

	try {
		const decoded = JWT.verify(token, process.env.JWT_SECRET);

		const [user] = await pool.query(
			`
            SELECT * FROM users 
            WHERE  id = ? 
        `,
			[decoded.id],
		);

		if (!user.length) {
			return res.status(404).json({
				status: "error",
				message: "Invaid token or validation error",
			});
		}

		const data = user[0];
		data.password = undefined;

		req.user = data;
		next();
	} catch (error) {
		console.log(error);

		if (error.message === "jwt expired") {
			return next(
				res.status(400).json({
					status: "error",
					message: "Token expried",
				}),
			);
		} else if (error.message === "jwt malformed") {
			return next(
				res.status(400).json({
					status: "error",
					message: "Token malformed",
				}),
			);
		} else if (error.message === "invalid token") {
			return next(
				res.status(400).json({
					status: "error",
					message: "Token is invalid",
				}),
			);
		} else {
			return next(
				res.status(400).json({
					status: "error",
					message: "Unkown error",
				}),
			);
		}
	}
};
