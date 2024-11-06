import { pool } from "../database/db_connection.js";

export const cartController = {};

// get user cart items
cartController.userCart = async (req, res, next) => {
	const { page, limit } = req.query;
	const { user_id } = req.params;

	const offset = (page - 1) * limit;

	const [cartItems] = await pool.query(
		`
            SELECT cart.id, 
            cart.user_id, 
            cart.product_id, 
            cart.date_added, 
            products.name, 
            products.description, 
            products.price, 
            products.quantity, 
            products.category_id, 
            category.category_name
            FROM cart 
            JOIN products ON cart.product_id = products.id 
            JOIN category ON category.id = cart.product_id 
            WHERE cart.user_id = ?
            ${limit && offset ? `LIMIT ${limit} OFFSET ${offset} ` : " "}
            `,
		[user_id],
	);

	const [cartCount] = await pool.query(
		`
            SELECT COUNT(*) AS amt FROM cart 
            WHERE user_id = ? 
        `,
		[user_id],
	);

	return res.status(200).json({
		status: "success",
		data: {
			cartItems,
			cartCount: cartCount[0].amt,
		},
	});
};

// get one cat item
// -------------------

// add cart item
cartController.add = async (req, res, next) => {
	// id, user_id, product_id, date_added
	const { user_id, product_id } = req.query; 

	if (!user_id && !product_id)
		return res.status(400).json({
			status: "error",
			message: "Unknown user or product. Failed to add cart item",
        });
    
	// check if item is already in the cart
	const [itemExist] = await pool.query(
		`
            SELECT COUNT(*) AS amt FROM cart 
            WHERE product_id = ? 
        `,
		[product_id],
	);

	// if item already in the cart return an error message
	if (itemExist[0].amt > 0)
		return res.status(400).json({
			status: "error",
			message: "Item already in cart",
		});

	// else if item not in cart add item
	const [addProduct] = await pool.query(
		`
            INSERT INTO cart(user_id, product_id, date_added) 
            VALUES(?, ?, CURRENT_TIMESTAMP()) 
        `,
		[user_id, product_id],
	);

	res.status(200).json({
		status: "success",
		data: {
			cartItem: {
				id: addProduct.insertId,
				user_id,
				product_id,
			},
		},
	});
};

//remove cart item
cartController.remove = async (req, res, next) => {
	const { id } = req.params;

	const [removeItem] = await pool.query(
		`
            DElETE FROM cart 
            WHERE id = ? 
        `,
		[id],
	);

	return res.status(200).json({
		status: "success",
		data: {
			changes: removeItem.affectedRows,
		},
	});
};
