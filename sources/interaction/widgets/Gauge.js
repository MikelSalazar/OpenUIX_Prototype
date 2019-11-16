/** Defines a Gauge Widget. */
class Gauge extends Widget {

	/** Initializes a new Gauge Instance.
	 * @param name The name of the Widget.
	 * @param parent The parent of the Widget.
	 * @param {*} params The creation parameters of the Widget. */
	constructor(name, parent, params = {}) {

		// Call the base class constructor
		super(name, parent, params)
		
		// Set the type of the instance
		this.isGauge = true;


		// Initialize the parameters
		this.style = new Parameter("Style", this, params.style, 'normal');
		this.label = new Parameter("Label", this, params.label, '');
		this.value = new Parameter("Value", this, params.value, 0);
		this.units = new Parameter("Units", this, params.units, '');
		this.valueMin = new Parameter("ValueMin", this, params.valueMin, 0);
		this.valueMax = new Parameter("ValueMax", this, params.valueMax, 1);
		this.valueLow = new Parameter("ValueLow", this, params.valueLow, 0);
		this.valueHigh = new Parameter("ValueHigh", this, params.valueHigh, 1);
		this.valueDigits = new Parameter("ValueDigits", this, params.valueDigits, 0);
	}


	/** Updates the Widget. */
	update() {

		// Make sure that the Widget is *not* updated
		if (this.updated) return;

		// If the style is not updated, (re)create the geometries
		if(!this.style.updated) {
			let style = this.style.get();

			// Reset the entity list (deleting any previous one)
			this.entities.forEach(entity => {entity.delete();})
			this.entities = []; this.shapes = {};
			let divisions = (this.valueMax - this.valueMin) / 10;

			// Create different shapes depending on the style
			switch (this.style.get()) {
				case 'normal':
					this.warp = new Warp({factor:270, offset:-135});
					this.shapes["ValueShape"] = new Box("ValueShape", this, {
						x: 0, y: 0, width: 0.01, height: 0.01, depth: 0.45, 
						modifiers:[this.warp], position: new Vector(0,0,0.01),
					});
					for (let division = 0; division <= divisions; division++) {
						let name = "DivisionShape" + division;
						let major = division % 2;
						let x = (1/divisions)* division -0.005;
						let y = 0.35 + (0.05 * major);
						let depth = 0.5 - y;
						this.shapes[name] = new Box(name, this, {
							x: x, y:y , width: 0.01, height: 0.01, depth: depth, 
							modifiers:[this.warp],
						});
					}
					this.shapes["Cylinder"] = new Cylinder("Cylinder", this, {
						x: 0, y: 0, radius: 0.1, height:0.1
					});
					this.shapes["LowRangeShape"] = new Box("LowRangeShape", this, {
						x: 0, y: 0.4, width:0.1, height: 0.001, depth: 0.1,
						color: new Color(0.25, 0.25, 1.0),
						modifiers: [this.warp]
					});
					this.shapes["NormalRangeShape"] = new Box("NormalRangeShape", this,{
							x: 0.1, y: 0.4, width:0.8, height: 0.001, depth: 0.1,
							color: new Color(0.25, 0.25, 0.25),
							modifiers: [this.warp]
					});
					this.shapes["HighRangeShape"] = new Box("HighRangeShape", this, {
							x: 0.9, y: 0.4, width: 0, height: 0.001, depth: 0.1,
							color: new Color(1.0, 0.25, 0.25),
							modifiers: [this.warp]
					});
					this.shapes["ValueText"] = new Text("ValueText", this, {
						position: new Vector(0,-0.3,0), depth: 0.01, size: 0.1,
						font:"Orbitron", text: this.value,
						numberDigits: this.valueDigits,
					});
					this.shapes["UnitsText"] = new Text("UnitsText", this, {
						position: new Vector(0.05,-0.5,0), depth: 0.01, size: 0.05,
						font:"Orbitron", text: this.units, alignY: 0, alignLine: 0
					});
					this.shapes["LabelText"] = new Text("LabelText", this, {
						position: new Vector(-0.05,-0.5,0), depth: 0.01, size: 0.05,
						font:"Orbitron", text: this.label, alignY: 0, alignLine: 1
					}); 
					break;
				case 'industrial':
					this.warp = new Warp({factor:120, offset:-60});
					this.shapes["ValueShape"] = new Box("ValueShape", this, {
						x: 0, y: 0, width: 0.01, height: 0.01, depth: 0.35, 
						modifiers:[this.warp], position: new Vector(0,0,0.01),
						color: new Color(0,0,0)
					});
					for (let division = 0; division <= divisions; division++) {
						let name = "DivisionShape" + division;
						let major = division % 2;
						let x = (1/divisions)* division -0.005;
						let y = 0.25 + (0.05 * major);
						let depth = 0.4 - y;
						this.shapes[name] = new Box(name, this, {
							x: x, y:y , width: 0.01, height: 0.01, depth: depth, 
							modifiers:[this.warp], color: new Color(0,0,0)
						});
					}
					this.shapes["Cylinder"] = new Cylinder("Cylinder", this, {
						x: 0, y: 0, radius: 0.05, height:0.1, color: new Color(0,0,0)
					});
					this.shapes["BackCylinder"] = new Cylinder("Cylinder", this, {
						x: 0, y: 0, position: new Vector(0,0,-0.1), radius: 0.5, height:0.1
					});
					this.shapes["LowRangeShape"] = new Box("LowRangeShape", this, {
						x: 0, y: 0.3, width:0.1, height: 0.005, depth: 0.1,
						color: new Color(0.25, 0.75, 0.25),
						modifiers: [this.warp]
					});
					this.shapes["NormalRangeShape"] = new Box("NormalRangeShape", this,{
							x: 0.1, y: 0.3, width:0.8, height: 0.005, depth: 0.1,
							color: new Color(0.25, 0.25, 0.25),
							modifiers: [this.warp]
					});
					this.shapes["HighRangeShape"] = new Box("HighRangeShape", this, {
							x: 0.9, y: 0.3, width: 0, height: 0.005, depth: 0.1,
							color: new Color(1.0, 0.25, 0.25),
							modifiers: [this.warp]
					});
					this.shapes["ValueText"] = new Text("ValueText", this, {
						position: new Vector(0,-0.3,0), depth: 0.01, size: 0.1,
						font:"Orbitron", text: this.value,
						numberDigits: this.valueDigits,
						color: new Color(0,0,0),
					});
					this.shapes["UnitsText"] = new Text("UnitsText", this, {
						position: new Vector(0.0,-0.4,0), depth: 0.01, size: 0.05,
						font:"Orbitron", text: this.units, alignY: 1,
						color: new Color(0,0,0),
					});
					this.shapes["LabelText"] = new Text("LabelText", this, {
						position: new Vector(0,-0.2,0), depth: 0.01, size: 0.05,
						font:"Orbitron", text: this.label, alignY: 0,
						color: new Color(0,0,0),
					}); 
					break;
				case 'medical':
						this.warp = new Warp({factor:240, offset:-120});
						this.shapes["ValueShape"] = new Box("ValueShape", this, {
							x: -0.05, y: 0.3, width: 0.1, height: 0.01, depth: 0.2, 
							modifiers:[this.warp]
						});
						this.shapes["LowRangeShape"] = new Box("LowRangeShape", this, {
							x: 0, y: 0.35, width:0.1, height: 0.01, depth: 0.1,
							color: new Color(0.25, 0.25, 1.0), materialSide: 'back',
							modifiers: [this.warp]
						});
						this.shapes["NormalRangeShape"] = new Box("NormalRangeShape", this,{
								x: 0.1, y: 0.35, width:0.8, height: 0.01,  depth: 0.1,
								color: new Color(0.25, 0.25, 0.25),	materialSide: 'back',
								modifiers: [this.warp]
						});
						this.shapes["HighRangeShape"] = new Box("HighRangeShape", this, {
								x: 0.9, y: 0.35, width: 0, height: 0.01, depth: 0.1,
								color: new Color(1.0, 0.25, 0.25), materialSide: 'back',
								modifiers: [this.warp]
						});
						this.shapes["ValueText"] = new Text("ValueText", this, {
							depth: 0.01, size: 0.15,
							font:"Orbitron", text: this.value,
							numberDigits: this.valueDigits,
						});
						this.shapes["UnitsText"] = new Text("UnitsText", this, {
							position: new Vector(0,-0.15,0), depth: 0.01, size: 0.06,
							font:"Orbitron", text: this.units, alignY: 1
						});
						this.shapes["LabelText"] = new Text("LabelText", this, {
							position: new Vector(0,0.15,0), depth: 0.01, size: 0.06,
							font:"Orbitron", text: this.label, alignY: 0,
						});
						break;
				case 'aerospace':
					this.warp = new Warp({factor:240, offset:-120});
					this.shapes["ValueShape"] = new Box("ValueShape", this, {
						x: 0, y: 0.4, width: 1, height: 0.01, depth: 0.1, 
						modifiers:[this.warp],
					});
					this.shapes["MinValueShape"] = new Box("MinValueShape", this, {
						y: 0.35, width: -0.01, height: 0.01, depth: 0.15, 
						modifiers:[this.warp],
					});
					this.shapes["MaxValueShape"] = new Box("MaxValueShape", this, {
							x:1, y: 0.35, width: 0.01, height: 0.01, depth: 0.15, 
							modifiers:[this.warp],
					});
						this.shapes["LowRangeShape"] = new Box("LowRangeShape", this, {
							x: 0, y: 0.4, width:0.1, height: 0.01, depth: 0.1,
							color: new Color(0.25, 0.25, 1.0), materialSide: 'back',
							modifiers: [this.warp]
					});
					this.shapes["NormalRangeShape"] = new Box("NormalRangeShape", this,{
							x: 0.1, y: 0.4, width:0.8, height: 0.01,  depth: 0.1,
							color: new Color(0.25, 0.25, 0.25),	materialSide: 'back',
							modifiers: [this.warp]
					});
					this.shapes["HighRangeShape"] = new Box("HighRangeShape", this, {
							x: 0.9, y: 0.4, width: 0, height: 0.01, depth: 0.1,
							color: new Color(1.0, 0.25, 0.25), materialSide: 'back',
							modifiers: [this.warp]
					});
					this.shapes["ValueText"] = new Text("ValueText", this, {
						depth: 0.01, size: 0.22,
						font:"Orbitron", text: this.value,
						numberDigits: this.valueDigits,
					});
					this.shapes["UnitsText"] = new Text("UnitsText", this, {
						position: new Vector(0,-0.15,0), depth: 0.01, size: 0.08,
						font:"Orbitron", text: this.units, alignY: 1
					});
					this.shapes["LabelText"] = new Text("LabelText", this, {
						position: new Vector(0,0.15,0), depth: 0.01, size: 0.08,
						font:"Orbitron", text: this.label, alignY: 0,
					});
					break;
				case 'futuristic':
					this.warp = new Warp({factor:270, offset:-180});
					this.shapes["ValueShape"] = new Box("ValueShape", this, {
						x: 0, y: 0.3, width:0.1, height: 0.01, depth: 0.1, 
						position: new Vector(0,-0.1,0),color: new Color(1, 1, 1),
						modifiers:[this.warp],
					});
					this.shapes["LowRangeShape"] = new Box("LowRangeShape", this, {
						x: 0, y: 0.3, width:0.1, height: 0.01, depth: 0.1, 
						position: new Vector(0,-0.1,0),
						color: new Color(0.25, 0.25, 1.0), materialSide: 'back',
						modifiers: [this.warp]
					});
					this.shapes["NormalRangeShape"] = new Box("NormalRangeShape", this,{
						x: 0.1, y: 0.3, width:0.8, height: 0.01, depth: 0.1, 
						color: new Color(0.25, 0.25, 0.25),	materialSide: 'back',
						position: new Vector(0,-0.1,0),
						modifiers: [this.warp]
					});
					this.shapes["HighRangeShape"] = new Box("HighRangeShape", this, {
						x: 0.9, y: 0.3, width: 0, height: 0.01, depth: 0.1,  
						color: new Color(1.0, 0.25, 0.25), materialSide: 'back',
						position: new Vector(0,-0.1,0),
						modifiers: [this.warp]
					});
					this.shapes["ValueText"] = new Text("ValueText", this, {
						position: new Vector(0,-0.1,0), depth: 0.01,
						font:"Orbitron", size: 0.16, text: this.value,
						numberDigits: this.valueDigits,
					});
					this.shapes["UnitsText"] = new Text("UnitsText", this, {
						position: new Vector(0.5,-0.3,0), depth: 0.01, 
						font:"Orbitron", size: 0.08, text: this.units, 
						alignY: 1, alignLine: 1	
					});
					this.shapes["LabelText"] = new Text("LabelText", this, {
						position: new Vector(-0.5, 0.4, 0), depth: 0.01,
						font:"Orbitron", size: 0.08, text: this.label, 
						alignY: 0, alignLine: 0
					});
					break;

				default: throw Error ('Invalid Style for Gauge Widget: ' +
					this.name + '. Valid values are "normal", "futuristic"');
			}

	
			// Create a Geometry entity for each shape
			for (const name in this.shapes) {
				let shape = this.shapes[name];
				let position = (shape.position)? shape.position : new Vector(0,0,0);

				this.entities.push(new Geometry(name + "Geometry", 
					this, {shape: shape, position: position}));
			}
		}

		// Get the value, teh maximum and minimum
		let value = this.value.get(),
			min = this.valueMin.get(),
			max = this.valueMax.get();
		if (min > max) { min = max; max = this.valueMin.get(); }
		if (value > max) value = max; 
		if (value < min) value = min;
		
		// Calculate the range and make sure it is valid
		let range = max - min; 
		if (range !== 0) {

			// Get the low and high values and check the,
			let low = this.valueLow.get(), high = this.valueHigh.get();
			if (low > high)  low = high; 
			if (low <= min || low >= max) low = min;
			if (high <= min || high >= max) high = max;

			// convert all values to percentage
			value = (value - min) / (range);
			low = (low - min) / (range); 
			high = (high - min) / (range); 

			// Draw the background
			if (this.shapes["LowRangeShape"]) this.shapes["LowRangeShape"].x.set(0);
			if (this.shapes["LowRangeShape"])this.shapes["LowRangeShape"].width.set(low);
			if (this.shapes["NormalRangeShape"])this.shapes["NormalRangeShape"].x.set(low);
			if (this.shapes["NormalRangeShape"])this.shapes["NormalRangeShape"].width.set(high - low);
			if (this.shapes["HighRangeShape"])this.shapes["HighRangeShape"].x.set(high);
			if (this.shapes["HighRangeShape"])this.shapes["HighRangeShape"].width.set(1 - high);

			if (this.style == 'normal' || this.style == 'industrial' || this.style == 'medical') {
				this.shapes["ValueShape"].x.set(value);
			}
			else this.shapes["ValueShape"].width.set(value);
		}

		// Call the base function
		super.update();
		this.updated = false;

		// Show a message on console
		// console.log("Gauge Updated: " + this.name);
	}
}