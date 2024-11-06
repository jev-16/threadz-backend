import { pool } from "../database/db_connection.js";

export const orderController = {};

// get all orders
orderController.all = async (req, res, next) => {
	const { page, limit } = req.query;
	const offset = (page - 1) * limit;

	const [orders] = await pool.query(`
            SELECT orders.id, 
            orders.user_id, 
            orders.order_date, 
            orders.total_cost, 
            users.first_name, 
            users.last_name, 
            users.email, 
            users.phone_num 
            FROM orders 
            JOIN users ON orders.user_id = users.id 
            ${page && limit ? `LIMIT ${limit} OFFSET ${offset} ` : " "}
        `);

	// get order details
	for (let order of orders) {
		const [orderDetails] = await pool.query(
			`
                SELECT order_details.id, 
                order_details.product_id, 
                order_details.qty AS product_quantity, 
                order_details.total_cost, 
                products.name, 
                products.description, 
                products.price, 
                products.category_id, 
                product_size.size,
                product_size.details,
                product_size.additional_cost AS size_cost, 
                product_color.image, 
                product_color.color, 
                product_color.additional_cost AS color_cost
                FROM order_details 
                JOIN products ON order_details.product_id = products.id 
                JOIN product_size ON order_details.size_id = product_size.id 
                JOIN product_color ON order_details.color_id = product_color.id 
                WHERE order_id = ? 
            `,
			[order.id],
		);

		order.order_detail = orderDetails;
	}

	const [orderCount] = await pool.query(`
            SELECT COUNT(*) AS amt FROM orders 
        `);

	return res.status(200).json({
		status: "success",
		data: {
			orders,
			orderCount: orderCount[0].amt,
		},
	});
};

// get all user orders
orderController.userOrders = async (req, res, next) => {
	const { user_id } = req.params;

	const { page, limit } = req.query;
	const offset = (page - 1) * limit;

	const [orders] = await pool.query(
		`
            SELECT orders.id, 
            orders.user_id, 
            orders.order_date, 
            orders.total_cost, 
            users.first_name, 
            users.last_name, 
            users.email, 
            users.phone_num 
            FROM orders 
            JOIN users ON orders.user_id = users.id 
            ${page && limit ? `LIMIT ${limit} OFFSET ${offset} ` : " "} 
            WHERE users.id = ? 
        `,
		[user_id],
	);

	// get order details
	for (let order of orders) {
		const [orderDetails] = await pool.query(
			`
                SELECT order_details.id, 
                order_details.product_id, 
                order_details.qty AS product_quantity,
                order_details.total_cost, 
                products.name, 
                products.description, 
                products.price, 
                products.category_id, 
                product_size.size,
                product_size.details,
                product_size.additional_cost AS size_cost,, 
                product_color.image, 
                product_color.color, 
                product_color.additional_cost AS color_cost 
                FROM order_details 
                JOIN products ON order_details.product_id = products.id 
                JOIN product_size ON order_details.size_id = product_size.id 
                JOIN product_color ON order_details.color_id = product_color.id 
                WHERE order_id = ? 
            `,
			[order.id],
		);

		order.order_detail = orderDetails;
	}

	const [orderCount] = await pool.query(
		`
            SELECT COUNT(*) AS amt FROM orders 
            WHERE orders.user_id = ? 
        `,
		[user_id],
	);

	return res.status(200).json({
		status: "success",
		data: {
			orders,
			orderCount: orderCount[0].amt,
		},
	});
};

// get one order
orderController.one = async (req, res, next) => {
	const { id } = req.params;

	const [order] = await pool.query(
		`
            SELECT orders.id, 
            orders.user_id, 
            orders.order_date, 
            orders.total_cost, 
            users.first_name, 
            users.last_name, 
            users.email, 
            users.phone_num 
            FROM orders 
            JOIN users ON orders.user_id = users.id 
            WHERE orders.id = ? 
        `,
		[id],
	);

	if (order.length > 0) {
		const [orderDetails] = await pool.query(
			`
            SELECT order_details.id, 
            order_details.product_id, 
            order_details.qty AS product_quantity, 
                order_details.total_cost, 
                products.name, 
                products.description, 
                products.price, 
                products.category_id, 
                product_size.size,
                product_size.details,
                product_size.additional_cost AS size_cost,, 
                product_color.image, 
                product_color.color, 
                product_color.additional_cost AS color_cost 
                FROM order_details 
                JOIN products ON order_details.product_id = products.id 
                JOIN product_size ON order_details.size_id = product_size.id 
                JOIN product_color ON order_details.color_id = product_color.id 
                WHERE order_id = ? 
                `,
			[order[0].id],
		);

		order[0].order_detail = orderDetails;

		res.status(200).json({
			status: "success",
			data: {
				order,
			},
		});
	} else {
		res.status(404).json({
			status: "error",
			message: "order not found",
		});
	}
};

// add new order
orderController.add = async (req, res, next) => {
	// collect user_id, product_id, size_id, color_id
	const { user_id } = req.query;
	const { details } = req.body;

	const [newOrder] = await pool.query(
		`
            INSERT INTO orders (user_id, order_date) 
            VALUES (?, CURRENT_TIMESTAMP())
        `,
		[user_id],
	);

	console.log("ORDER: ", newOrder);

	let orderTotalCost = 0;
	if (newOrder.insertId) {
		// add order details
		for (let product of details) {
			// get data to calculate total cost for the order
			const [totalCostData] = await pool.query(
				`
            SELECT 
            p.price, 
            pc.additional_cost AS price_color, 
            ps.additional_cost AS price_size 
            FROM products p 
            JOIN product_color pc ON p.id = pc.product_id AND pc.id = ? 
            JOIN product_size ps ON p.id = ps.product_id AND ps.id = ? 
            WHERE p.id = ? 
        `,
				[product.color_id, product.size_id, product.product_id],
			);

			console.log("TOTAL COST QUERY: ", totalCostData);

			const total = (parseFloat(totalCostData[0].price) + parseFloat(totalCostData[0].price_color) + parseFloat(totalCostData[0].price_size)) * product.qty;
			orderTotalCost += total;
			console.log("TOTAL COST CALCULATION: ", total);
			console.log("ORDER COST: ", orderTotalCost);

			const [orderDetails] = await pool.query(
				`
                INSERT INTO order_details(order_id, product_id, qty, color_id, size_id, total_cost) 
                VALUES (
                    ?, ?, ?, 
                    ?, ?, ?
                )
            `,
				[newOrder.insertId, product.product_id, product.qty, product.color_id, product.size_id, total],
			);

			console.log("ORDER DETAILS INSERT: ", orderDetails);
		}

		// update the cost for the order
		const [updateOrderTotalCost] = await pool.query(`
                UPDATE orders 
                SET total_cost = ${orderTotalCost} 
                WHERE id = ${newOrder.insertId} 
            `);

		res.status(200).json({
			status: "success",
			data: {
				details,
				newOrder,
			},
		});
	} else {
		res.status(400).json({
			status: "error",
			message: "Failed to create order",
		});
	}
};

// delete order
