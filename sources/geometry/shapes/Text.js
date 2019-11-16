/** Defines a Text Shape */
class Text extends Shape {

	/** Initializes a new Text Instance.
	 * @param {*} name The name of the Text.
	 * @param {*} params The creation parameters of the Text. */
	constructor(name, parent, params = {}) {

		// Call the base class constructor
		super(name || '[Text]', parent, params);

		// Set the type of the instance
		this.isText = true;

		// Define the properties of the Text
		this.text = new Parameter("text", this, params.text, 0);
		this.x = new Parameter("Z", this, params.x, 0);
		this.y = new Parameter("Y", this, params.y, 0);
		this.z = new Parameter("Z", this, params.z, 0);
		this.font = new Parameter("Font", this, params.font, 1);
		this.depth = new Parameter("Depth", this, params.depth, 0.1);
		this.alignX = new Parameter("X Alignment", this, params.alignX, 0);
		this.alignY = new Parameter("Y Alignment", this, params.alignY, 0.5);
		this.alignZ = new Parameter("Z Alignment", this, params.alignZ, 0);
		this.size = new Parameter("Size", this, params.size, 1);
		this.alignLine = new Parameter("Line Alignment", this, params.alignLine, 0.5);
		this.numberDigits =new Parameter("Number Digits", this, params.numberDigits, 2);
	}


	/** Updates the Text data.
	* @param {*} forced Indicates whether to force the update or not.*/
	update() {

		// Check if the Text must be updated
		if (this.updated) return;

		// Check if the font is loaded
		let font = Font.instances[this.font.get()];
		if (!font.loaded) return;

		// Get the text string
		let text = this.text.get();
		if (Number.isFinite(text)) text = text.toFixed(this.numberDigits.get());
		

		// Create the variables to handle per-line alignment
		let lineIndex = 0, lineWidths = [], lineHeight = font.lineHeight;

		// Calculate the bounding box
		let x = 0, y = 0, z = 0, w = 0, h = 0, s = this.size.get(), d = this.depth.get();
		let charIndex, charCount = text.length;
		for (charIndex = 0; charIndex < charCount; charIndex++) {
			let char = text[charIndex];
			if (char == '\n') { 
				lineIndex++; lineWidths.push(x);
				x = 0; h -= lineHeight; continue;
			}
			let glyph = font.glyphs[char];
			if (!glyph) continue;
			x += glyph.ha;
			if (w < x) w = x;
		}
		lineWidths.push(x); h += lineHeight + font.descender;

		// Align the text properly
		x = -w * this.alignX.get();
		y = -h * this.alignY.get();
		z = -d * this.alignZ.get();

		lineIndex = 0;
		let x0 = w * this.alignX.get();
		x = x0 + (-lineWidths[lineIndex] * this.alignLine.get());

		// Create a rectangular shape with the current parameters
		let base = new Path(); 
		for (charIndex = 0; charIndex < charCount; charIndex++) {
			let char = text[charIndex];
			if (char == '\n') { 
				x = x0 + (-lineWidths[++lineIndex] * this.alignLine.get());
				y -= lineHeight; continue;
			}
			let glyph = font.glyphs[char];
			if (!glyph) continue;
			base.join(glyph.path, new Vector(x, y, z), null, new Vector(s, s, 1));
			x += glyph.ha;
		}

		// Extrude the shape to generate the geometry
		ShapeUtils.extrude(this, base, this.depth.get());
		
		// Call the base class
		super.update();

		// Show a message on console
		// console.log("Text Updated: " + this.name);
	}
}