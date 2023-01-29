module.exports = {
	env: {
		es6: true,
		browser: true,
		commonjs: true,
		es2021: true
	},
	extends: ["airbnb-base", "prettier"],
	parserOptions: {
		ecmaVersion: "latest",
		sourceType: "module"
	},
	plugins: ["prettier"],
	root: true,
	rules: {
		"prettier/prettier": "error",
		"import/no-unresolved": "off"
	}
};
