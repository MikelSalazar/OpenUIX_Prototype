/** Defines an Interaction Controller */
class Controller {

	/** Initializes a new Controller Instance.
	 * @param layer The Layer associated to the Controller.
	 * @param {*} params The creation parameters of the Controller. */
	constructor (layer, params = {}) {

		// Store the type of the class
		this.isController = true;

		// Store Layer associated to the Controller.
		this.layer = layer;

		// Mark the 
		this.updated = false;
	}
}