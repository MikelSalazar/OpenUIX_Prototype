/** Defines a Rectangular Path. */
class RectanglePath extends Path {

	/** Initializes a new RectanglePath instance. 
	 * @param {*} params The creation parameters of the Path. */
	constructor(params = {}) {

		// Call the base class constructor
		super(params);

		// Define the properties of the Path
		this.isRectanglePath = true;
		this.x = new Parameter("X", this, params.x, 0);
		this.y = new Parameter("Y", this, params.y, 0);
		this.width = new Parameter("Width", this, params.width, 1);
		this.height = new Parameter("Height", this, params.height, 1);
		this.centered = new Parameter("Centered", this, params.centered, false);
		this.rounded = new Parameter("Rounded", this, params.rounded, 0);

		// Set the path as two-dimensional
		this.dimensions = 2;

		// Create the segments of the path
		this.update(true, { justSegments: true })
	}


	/** Create a copy of the RectanglePath. */
	clone() { return new RectanglePath(this); }


	/** Updates the RectanglePath data.
	* @param {*} forced Indicates whether to force the update or not.
	* @param {*} params Interpolation parameters. */
	update(forced, params = {}) {
		
		// Check if the Path must be updated
		if(this.updated && !forced) return;

		// Check the parameters
		let x = this.x.update(), y = this.y.update(),
			w = this.width.update(), h = this.height.update(), 
			r = this.rounded.update(), c = this.centered.update(),
			hw, hh, x0, x1, y0, y1 ;

		// Calculate the positions
		if (w > 0) { x0 = x; x1 = x + w; } else { x0 = x + w; x1 = x; w = -w; }
		if (h > 0) { y0 = y; y1 = y + h; } else { y0 = y + h; y1 = y; h = -h; }
		if (r < 0 ) r = 0 ; 
		hw = w / 2; hh = h / 2; if (r > hw) r = hw; if (r > hh) r = hh;
		if (c) { x0 -= hw; x1 -= hw; y0 -= hh; y1 -= hh; }

		// Create the segments
		this.segments = [];
		if (w !== 0 || h !== 0) {
			ShapeUtils.currentPath = this;
			if (r > 0) {
				let rV = new Vector(r, r);
				ShapeUtils.drawMove(new Vector(x0+r, y0));
				ShapeUtils.drawLine(new Vector(x1-r, y0));
				ShapeUtils.drawArc(new Vector(x1, y0+r), 
					new Vector(x1-r, y0+r), rV, 270, 360);
				ShapeUtils.drawLine(new Vector(x1, y1-r));
				ShapeUtils.drawArc(new Vector(x1-r, y1), 
					new Vector(x1-r, y1-r), rV, 0, 90);
				ShapeUtils.drawLine(new Vector(x0+r, y1));
				ShapeUtils.drawArc(new Vector(x0, y1-r), 
					new Vector(x0+r, y1-r), rV, 90, 180);
				ShapeUtils.drawLine(new Vector(x0, y0+r));
				ShapeUtils.drawArc(new Vector(x0+r, y0), 
					new Vector(x0+r, y0+r), rV, 180, 270);
			} else {
				ShapeUtils.drawMove(new Vector(x0, y0));
				ShapeUtils.drawLine(new Vector(x1, y0));
				ShapeUtils.drawLine(new Vector(x1, y1));
				ShapeUtils.drawLine(new Vector(x0, y1));
				ShapeUtils.drawLine(new Vector(x0, y0));
			}
		}

		// Call the base class
		if (!params.justSegments) super.update(forced, params);
	}
}