import multer from "multer";
import cryptoRandomString from "crypto-random-string";

export const fileNameExt = cryptoRandomString({ length: 10, type: "alphanumeric" });

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "./assets/images/products");
	},
	filename: function (req, file, cb) {
		cb(null, `${fileNameExt}_${file.originalname}`);
	},
});

export const upload = multer({ storage });
