import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

export const pool = mysql
	.createPool({
		host: process.env.db_host,
		user: process.env.db_user,
		database: process.env.db_name,
		password: process.env.db_pw,
	})
	.promise();
