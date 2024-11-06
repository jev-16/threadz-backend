import { pool } from "../database/db_connection.js";

export const categoryController = {};

// GET ALL CATEGORIES
categoryController.all = async (req, res, next) => {
	const { page, limit } = req.query;
	const offset = (page - 1) * limit;

	try {
		const [categories] = await pool.query(`
                SELECT id, category_name 
                FROM category 
                ${limit && offset ? `LIMIT ${limit} OFFSET ${offset}` : ""} 
            `);

		return res.status(200).json({
			status: "success",
			data: {
				categories,
			},
		});
	} catch (error) {
		return res.status(400).json({
			status: "error",
			message: "Failed to retrieve categories",
		});
	}
};

// GET ONE CATEGORY
categoryController.one = async (req, res, next) => {
	const { id } = req.params;

	const [category] = await pool.query(
		`
            SELECT id, category_name 
            FROM category 
            WHERE id = ? 
        `,
		[id],
	);

	if (!category)
		return res.status(404).json({
			status: "error",
			message: "Category not found",
		});

	return res.status(200).json({
		status: "success",
		data: {
			category: category[0],
		},
	});
};

// ADD CATEGORY
categoryController.add = async (req, res, next) => {
	const { category } = req.body;

	// check if category already exist
	const [catCheck] = await pool.query(
		`
            SELECT COUNT(*) AS category FROM category 
            WHERE category_name = ? 
        `,
		[category],
	);

	if (!catCheck[0].category) {
		const [newCat] = await pool.query(
			`
                INSERT INTO category(category_name) 
                VALUES (?) 
            `,
			[category],
        );
        
        console.log(newCat);
        

		newCat.insertId
			? res.status(200).json({
					status: "success",
					data: {
						category: {
							id: newCat.insertId,
							category,
						},
					},
			  })
			: res.status(400).json({
					status: "error",
					message: "Failed to add category",
			  });
    } else {
        res.status(400).json({
			status: "error",
			message: "Category already exist",
		});
    }
};

// UPDATE CATEGORY
categoryController.edit = async (req, res, next) => {
	const { id } = req.params;
	const { category } = req.body;

	const [updateCat] = await pool.query(
		`
            UPDATE category 
            SET category_name = ? 
            WHERE id = ? 
        `,
		[category, id],
	);

	updateCat.affectedRows
		? res.status(200).json({
				status: "success",
				data: {
					changes: updateCat.affectedRows,
					category: {
						id,
						category,
					},
				},
		  })
		: res.status(400).json({
				status: "error",
				message: "Failed to update category",
		  });
};

// DELETE CATEGORY
categoryController.delete = async (req, res, next) => {
	const { id } = req.params;

	const [deleteCat] = await pool.query(
		`
            DELETE FROM category 
            WHERE id = ? 
        `,
		[id],
	);

	deleteCat.affectedRows
		? res.status(200).json({
				status: "success",
				data: {
					changes: deleteCat.affectedRows,
				},
		  })
		: res.status(400).json({
				status: "error",
				message: "Failed to delete category",
		  });
};
