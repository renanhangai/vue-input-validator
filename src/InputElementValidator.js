import Rules from './Rules';

/**
 * Input validators
 */
export default class InputElementValidator {

	constructor( element, parentValidator ) {
		this.$element         = element;
		this.$parentValidator = parentValidator;
		this.$validation      = null;

		const el    = element.$el  || element;
		const name  = element.name || el.getAttribute( 'name' );
		this.$name  = name;
	}

	get element() { return this.$element; }

	update( binding, vnode ) {
		this.$validation = binding.value;
	}

	validate( state, options ) {
		const value = this.$element.value;
		const name  = this.$name;
		return Rules.validate( value, this.$validation, this.$parentValidator.$options )
			.catch( ( err ) => {
				this.$parentValidator.setError( name, null );
				return Promise.reject( err );
			});
	}
	
}
