const fs = require('fs-extra');
const path = require('path');
const { minify } = require('terser');

async function build() {
	// Ensure directories exist
	fs.ensureDirSync(path.join(__dirname, 'dist'));
	fs.ensureDirSync(path.join(__dirname, 'docs/assets/js'));

	// Read source file
	const sourcePath = path.join(__dirname, 'src/lib/embedManager.js');
	const sourceCode = fs.readFileSync(sourcePath, 'utf8');

	// Create regular distribution version
	fs.writeFileSync(path.join(__dirname, 'dist/embedManager.js'), sourceCode);

	// Create minified version
	const minified = await minify(sourceCode, {
		compress: true,
		mangle: true,
		output: {
			comments: /^!/,
		},
	});
	fs.writeFileSync(path.join(__dirname, 'dist/embedManager.min.js'), minified.code);

	// Create ES module version
	const esmCode = sourceCode
		.replace('// Initialize EmbedManager', '// ESM version of EmbedManager\nexport default EmbedManager;\n\n// Initialize EmbedManager for non-module usage')
		.replace('new EmbedManager();', '// Uncomment the line below if using as a regular script\n// new EmbedManager();');
	fs.writeFileSync(path.join(__dirname, 'dist/embedManager.esm.js'), esmCode);

	// Copy to docs
	fs.copyFileSync(
		path.join(__dirname, 'dist/embedManager.min.js'),
		path.join(__dirname, 'docs/assets/js/embedManager.min.js')
	);
	fs.copyFileSync(
		path.join(__dirname, 'src/lib/embedManager.js'),
		path.join(__dirname, 'docs/assets/js/embedManager.js')
	);

	console.log('Build complete. Files written to dist/ and docs/assets/js/');
}

build().catch(err => {
	console.error('Build failed:', err);
	process.exit(1);
});
