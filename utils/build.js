/******************************************************************************
  OpenUIX ThreeJS Build System
******************************************************************************/
'use strict'

// ----------------------------------------------------------- GLOBAL CONSTANTS

// The NodeJS modules
const fs = require('fs'), 						// File System access
	path = require('path'),						// File Path handling
	exec = require('child_process').execSync;	// External command execution

// Folder and file paths 
const sourcesFolder = 'sources/',
	librariesFolder = 'libraries/',
	binariesFolder = 'binaries/',
	combinedFileName = 'openuix_test.dbg.js',
	minifiedFileName = 'openuix_test.min.js',
	sourceMapFileName = 'openuix_test.min.js.map',
	bundleFileName = 'openuix_test.bundle.js',
	projectRootPath =  path.resolve(__dirname, '..\\') + "\\",
	sourcesFolderPath = path.resolve(projectRootPath, sourcesFolder),
	librariesFolderPath = path.resolve(projectRootPath, librariesFolder),
	binariesFolderPath = path.resolve(projectRootPath, binariesFolder),
	combinedFilePath = path.resolve(binariesFolderPath, combinedFileName),
	minifiedFilePath = path.resolve(binariesFolderPath, minifiedFileName),
	bundleFilePath = path.resolve(binariesFolderPath, bundleFileName),
	bundleFiles = [
		{name: "three.min.js", minify: false },
		{name: "Earcut.js", minify: true },
		{name: "GLTFLoader.js", minify: true },
	];


// Other values
const textFile = {encoding:"utf8"};

// ----------------------------------------------------------- GLOBAL VARIABLES
// The list of source files
var sourceFilePaths = [], relativeSourceFilePaths = [];

// ------------------------------------------------------------------ FUNCTIONS
/** Finds the Source files of the project. */
function findSourceFilesFromDirectory(directoryPath) {

	// Create a variable to process the subdirectories at the end
	let subDirectories =[]

	// Read the directory
	fs.readdirSync(directoryPath).filter(function(fileName) {
		
		// Create the absolute and relative paths
		let filePath = path.resolve(directoryPath, fileName);

		// If it is a directory, recursively process it
		if (fs.statSync(filePath).isDirectory()) {
			return subDirectories.push(filePath); 
		}

		// Skip the result files
		if (filePath.indexOf(combinedFileName) >= 0) return;
		if (filePath.indexOf(minifiedFileName) >= 0) return;
		if (filePath.indexOf(sourceMapFileName) >= 0) return;
	
		// Skip the files in the extra folder
		let relativeFilePath = path.relative(sourcesFolderPath, filePath);
		if (relativeFilePath.startsWith('extra')) return;

		// Skip void files
		if (fs.readFileSync(filePath, textFile).length == 0) return;
		
		// Add the path to the source file to the list
		sourceFilePaths.push(filePath);
		relativeSourceFilePaths.push(relativeFilePath);
	});

	// Process the subdirectories at the end
	subDirectories.forEach(s=> { findSourceFilesFromDirectory(s); } );
}


/** Combines several source files into another file. */
function combineSourceFiles() {
	
	// Create a to store the output string
	let outputFileString = "";

	// Load and process each file independently
	sourceFilePaths.forEach(filePath => { 

		// Read the source file
		let fileString = fs.readFileSync(filePath, textFile);

		if (fileString.length == 0) return;

		// Calculate the relative file path
		let relativeFilePath = path.relative(sourcesFolderPath, filePath);

		//Show a message on console
		console.log("Combining: " + relativeFilePath);

		// Add a header and the Source Map URL
		outputFileString += fileString + '\n';
			//'// File: ' + relativeFilePath + '\n' + fileString + 
			// '\n//# sourceMappingURL=' + relativeFilePath.replace(/\\/g, "/") + 
			//'\n\n';
	});

	// Save the combined file
	console.log("Writing combined file to: " + combinedFilePath);
	fs.writeFileSync(combinedFilePath, outputFileString, textFile);
}


/** Minimizes the combined source files. */
function minimizeCombinedSourceFiles() {

	let sourceFileList = "";
	relativeSourceFilePaths.forEach(filePath => {
		sourceFileList += " ../sources/" + filePath; }); 

	// Create the command
	let command = "google-closure-compiler" +
		" --language_in ECMASCRIPT_2016" + 
		" --language_out ECMASCRIPT_2016" +
		" --env CUSTOM" + // By changing it from BROWSER we can overwrite names
		" --rewrite_polyfills=false" + // Important to avoid inserting polyfills
		// " --externs extra/externs.js" +
		// " --entry_point ../sources/App.js" +
		" --dependency_mode PRUNE_LEGACY" +
		" --js_output_file " + minifiedFileName + 
		" --create_source_map " + sourceMapFileName + 
		sourceFileList;
	
	// Show a message on console
	console.log ("Command: " + command); 

	// use Closure Compiler to minify the files
	// npm install -g google-closure-compiler
	try { exec(command, {"cwd": binariesFolderPath}); }
	catch (error) { 
		console.log("Error: " + sourcesFolderPath +" \n" + error.stdout);
		if (error.stderr) console.log("Critical Error:" + error.stderr);
		process.exit(1);
	}

	// Add the source Mapping URL to the end of the minified file
	let fileString;
	fileString = fs.readFileSync(minifiedFilePath, textFile);
	fileString += '\n//# sourceMappingURL=' + sourceMapFileName;
	fs.writeFileSync(minifiedFilePath, fileString, textFile);
}


/** Creates a bundle file with the three  files. */
function linkFiles() {

	// Save the combined file
	console.log("Linking files...");
	
	// Add th license string to the minified file
	let bundleString = '// OpenUIX Prototype 0.1   https://openuix.org\n';

	// Include the content of the minified file
	bundleString += fs.readFileSync(minifiedFilePath, textFile);
	
	// Remove the link to the sourceMap
	let sourceMapLink = bundleString.lastIndexOf("\n//#");
	if (sourceMapLink>0) bundleString=bundleString.substring(0,sourceMapLink);

	// Embed the external files in the library folder
	bundleFiles.forEach(bundleFile => {

		// Get the complete file path
		let filePath = path.resolve(librariesFolderPath, bundleFile.name);

		// Add a comment in the begging to identify the fiel
		bundleString += '\n\n// Embedded File: ' + bundleFile.name + "\n";

		// Check if we have to minify the file
		if (bundleFile.minify) {
			console.log("Minifying: " + bundleFile.name);
			let tempFile = filePath + '.temp';
			exec("google-closure-compiler --js_output_file " + tempFile + 
				' '  + filePath, {"cwd": librariesFolderPath});
			bundleString += fs.readFileSync(tempFile, textFile);
			fs.unlinkSync(tempFile);
		} else { // If not, just add its contents to the bundle file
			console.log("Embedding: " + bundleFile.name);
			bundleString += fs.readFileSync(filePath, textFile);
		}
		
	});
	
	// Write the bundle file
	fs.writeFileSync(bundleFilePath, bundleString, textFile);
}


//----------------------------------------------------------------- ENTRY POINT

// Call the different tasks in sequence
process.stdout.write('\x1B[2J'); // Clean the terminal
console.log("Building Prototype");
findSourceFilesFromDirectory(sourcesFolderPath);
combineSourceFiles();
minimizeCombinedSourceFiles();
linkFiles();
console.log("Prototype Building Completed");