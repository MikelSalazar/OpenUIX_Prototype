/* Defines a geometric Font */
class Font {

	/** Initializes a new CameraController Instance.
	 * @param name The name of the Font.
	 * @param filePath The Path to the file containing the JS Font.*/
	constructor (name, filePath) {
		
		// Check the given values
		if (!name) throw new Error("Invalid font name");
		if (!filePath) throw new Error("Invalid font filePath");

		
		// Create the fields of the Font
		this.name = name; 
		this.filePath = filePath;
		this.loaded = false;
		this.glyphs = {};

		// Load the file
		this.file = new File("Font " + name, { path: filePath,
			onload : (file) => { this.loadJson(file.data); }});

		// Add the instance
		if (!Font.instances[name]) Font.instances[name] = this;
		else throw new Error("Font '" + name + "' already exists");
	}

	/** Loads a JSON font file.
	 * @param {*} data The JSON object with the font data.*/
	loadJson (data) {
		// Mark the font as not loaded
		this.loaded = false;

		// Get the main parameters of the font
		this.resolution = data.resolution;
		this.ascender = data.ascender / data.resolution;
		this.descender = data.descender / data.resolution;
		this.lineHeight = this.ascender - this.descender;

		// Create a shape for every glyph
		this.glyphs = {}; let scaleFactor = 1 / this.resolution;
		let glyphKeys = Object.keys(data.glyphs), glyphCount = glyphKeys.length;
		for (let glyphIndex = 0; glyphIndex < glyphCount; glyphIndex++) {
			let glyphKey = glyphKeys[glyphIndex], 
				glyphData = data.glyphs[glyphKey],
				glyphSvgData = glyphData.o;
				if (!glyphSvgData) continue;
			let path = ShapeUtils.readSvgPath(glyphSvgData,{scale:scaleFactor});
			path.reversed = true;
			path.update(true, {dimensions:2});
			this.glyphs[glyphKey] = {path: path, ha: glyphData.ha/data.resolution};
		}


		// Mark the font as loaded
		this.loaded = true;
	}
}

/** The static list of Fonts. */
Font.instances = {};
