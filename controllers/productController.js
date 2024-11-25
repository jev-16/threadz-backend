import { pool } from "../database/db_connection.js";
import { fileNameExt } from "../utils/fileupload.js";

export const productController = {};

// get all products
productController.all = async (req, res, next) => {
	const { page, limit } = req.query;
	const offset = (page - 1) * limit;
	// id, name, description, price, qty, category_id;
	const [products] = await pool.query(
		`
        SELECT products.id, 
        products.name, 
        products.description, 
        products.price, 
        products.category_id,
        category.category_name, 
        products.quantity 
        FROM products 
        JOIN category ON products.category_id = category.id 
        ${page > 0 && limit > 0 ? `LIMIT ${limit} OFFSET ${offset}` : ""} 
            `,
	);

	for (let product of products) {
		// get product color variants
		let [colorVariant] = await pool.query(
			`
				SELECT id, product_id, image, color, additional_cost 
				FROM product_color 
				WHERE product_id = ? 
			`,
			[product.id],
		);

		product.colors = colorVariant;

		// get product size variants
		let [sizeVariant] = await pool.query(
			`
				SELECT id, product_id, size, details, additional_cost 
				FROM product_size  
				WHERE product_id = ? 
			`,
			[product.id],
		);

		product.sizes = sizeVariant;
	}

	const [productCount] = await pool.query(`
            SELECT COUNT(*) AS PRODUCT_COUNT FROM PRODUCTS
        `);

	return res.status(200).json({
		status: "success",
		data: {
			products,
			productCount: productCount[0].PRODUCT_COUNT,
		},
	});
};

// get products by category
productController.byCategory = async (req, res, next) => {
	const { category, page, limit } = req.query;
	const offset = (page - 1) * limit;

	const [products] = await pool.query(
		`
        SELECT products.id, 
        products.name, 
        products.description, 
        products.price, 
        products.category_id,
        category.category_name, 
        products.quantity
        FROM products 
        JOIN category ON products.category_id = category.id
        WHERE category_name = ? 
        ${page > 0 && limit > 0 ? `LIMIT ${limit} OFFSET ${offset}` : ""} 
        `,
		[category],
	);

	for (let product of products) {
		// get product color variants
		let [colorVariant] = await pool.query(
			`
				SELECT id, product_id, image, color, additional_cost 
				FROM product_color 
				WHERE product_id = ? 
			`,
			[product.id],
		);

		product.colors = colorVariant;

		// get product size variants
		let [sizeVariant] = await pool.query(
			`
				SELECT id, product_id, size, details, additional_cost 
				FROM product_size  
				WHERE product_id = ? 
			`,
			[product.id],
		);

		product.sizes = sizeVariant;
	}

	const [productCount] = await pool.query(
		`
            SELECT COUNT(*) AS AMT FROM products  
            JOIN category ON products.category_id = category.id 
            WHERE category_name = ?
        `,
		[category],
	);

	return res.status(200).json({
		status: "success",
		data: {
			products,
			productCount: productCount[0].AMT,
		},
	});
};

// get one product
productController.one = async (req, res, next) => {
	const { id } = req.params;

	const [product] = await pool.query(
		`
        SELECT products.id, 
        products.name, 
        products.description, 
        products.price, 
        products.category_id,
        category.category_name, 
        products.quantity 
        FROM products 
        JOIN category ON products.category_id = category.id
        WHERE products.id = ? 
        `,
		[id],
	);

	if (!product)
		return res.status(404).json({
			status: "error",
			message: "Product not found",
		});

	// get product color variants
	let [colorVariant] = await pool.query(
		`
				SELECT id, product_id, image, color, additional_cost 
				FROM product_color 
				WHERE product_id = ? 
			`,
		[product[0].id],
	);

	product[0].colors = colorVariant;

	// get product size variants
	let [sizeVariant] = await pool.query(
		`
				SELECT id, product_id, size, details, additional_cost 
				FROM product_size  
				WHERE product_id = ? 
			`,
		[product[0].id],
	);

	product[0].sizes = sizeVariant;

	return res.status(200).json({
		status: "success",
		data: {
			product: product[0],
		},
	});
};

// add product
productController.add = async (req, res, next) => {
	const { prod_nme, prod_desc, prod_price, cat_id, qty, colorVariants, sizeVariants } = req.body;
	const files = req.files;
	console.log("NEW PRODUCT", req.body);

	let img = "";

	const [newProduct] = await pool.query(
		`
            INSERT INTO products (name, description, price, quantity, category_id) 
            VALUES (?, ?, ?, ?, ?) 
        `,
		[prod_nme, prod_desc, prod_price, qty, cat_id],
	);

	if (!newProduct.insertId)
		return res.status(400).json({
			status: "error",
			message: "Failed to add product",
		});

	// add color variants for product
	let cVariants = JSON.parse(colorVariants);
	let i = 0;

	for (let color of cVariants) {
		const file = req.files;
		console.log("FILE: ", file);

		if (file[i]) {
			img = `${fileNameExt}_${file[i].originalname}`;
		}

		const [addVariant] = await pool.query(
			`
				INSERT INTO product_color (product_id, image, color, additional_cost) 
				VALUES (?, ?, ?, ?)
			`,
			[newProduct.insertId, img, color.color, color.additional_cost],
		);

		i += 1;
	}

	// add size variants for product
	const sVariants = JSON.parse(sizeVariants);
	for (let size of sVariants) {
		const [addVariant] = await pool.query(
			`
				INSERT INTO product_size (product_id, size, details, additional_cost) 
				VALUES (?, ?, ?, ?)
			`,
			[newProduct.insertId, size.size, size.details, size.additional_cost],
		);
	}

	const product = {
		id: newProduct.insertId,
		prod_nme,
		prod_desc,
		prod_price,
		cat_id,
		qty,
		cVariants,
		sVariants,
	};

	return res.status(200).json({
		status: "success",
		data: product,
	});
};

// edit product
productController.edit = async (req, res, next) => {
	const { id } = req.params;
	const { prod_nme, prod_desc, prod_price, cat_id, qty } = req.body;
	const file = req.file;

	// file ? (img = `${fileNameExt}_${file.originalname}`) : (img = "");
	let img = "";
	if (file) img = `${fileNameExt}_${file.originalname}`;

	const [editProduct] = await pool.query(
		`
            UPDATE products
            SET name = ?, 
            description = ?, 
            price = ?, 
            category_id = ?, 
            quantity = ?
            WHERE id = ? 
        `,
		[prod_nme, prod_desc, prod_price, cat_id, qty, id],
	);

	// ${file ? `, images = '${img}'` : ""}

	if (!editProduct.affectedRows)
		return res.status(400).json({
			status: "error",
			message: "failed to make changes to product",
		});

	const product = {
		id,
		prod_nme,
		prod_desc,
		prod_price,
		cat_id,
		qty,
	};

	return res.status(200).json({
		status: "success",
		data: { product },
	});
};

// delete product
productController.delete = async (req, res, next) => {
	const { id } = req.params;

	// delete product variants before product
	const [deleteSizes] = await pool.query(
		`
			DELETE FROM product_size 
			WHERE product_id = ? 
		`,
		[id],
	);
	const [deleteColors] = await pool.query(
		`
			DELETE FROM product_color  
			WHERE product_id = ? 
		`,
		[id],
	);

	const [delProduct] = await pool.query(
		`
            DELETE FROM products 
            WHERE id = ? 
        `,
		[id],
	);

	if (!delProduct.affectedRows)
		return res.status(400).json({
			status: "error",
			message: "Failed to delete product ",
		});

	return res.status(201).json({
		status: "success",
		data: {
			changes: delProduct.affectedRows,
		},
	});
};
