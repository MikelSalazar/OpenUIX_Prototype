/** Defines a Sine wave Data Generator. */
class SineWaveGenerator extends Source{

	/** Initializes a new SineWaveGenerator Instance.
	 * @param name The name of the SineWaveGenerator.
	 * @param {*} params The creation parameters of the Generator. */
	constructor(name, params = {}) {

		// Call the parent constructor
		super (name, params)

		this.offset = params.factor || 0;
		this.factor = params.factor || 1000;
		this.minValue = params.minValue || 0;
		this.maxValue = params.maxValue || 1;
	}

	/** Updates the SineWaveGenerator data. */
	update () {
		this.value = (((Math.sin(currentTime/this.factor + this.offset)+1)/2) *
				(this.maxValue - this.minValue)) + this.minValue;

		// Show a message on console
		// console.log("SineWaveGenerator '" + this.name + "':" + this.value);

		// Call the base function
		super.update();
	}
}