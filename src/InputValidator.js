import InputElementValidator from './InputElementValidator';

/**
 
 InputValidator

 This class will bind to a group of inputs and validate then all

 */
export default class InputValidator {
	/**
	 * Construct this validator
 	 */
	constructor( component, parentValidator, options ) {
		this.$component       = component;
		this.$parentValidator = parentValidator;
		this.$options         = options;
		this.$childValidators = [];

		this.$rootValidator   = this;
		if ( this.$parentValidator ) {
			this.$rootValidator = this.$parentValidator.$rootValidator;
			this.$parentValidator.$childValidators.push( this );
		}
		
		this._inputElements = [];
	}

	/**
	 * Setup elements after defining reactive
	 */
	setup() {
		this.$options.vue.util.defineReactive( this, '$errors', {} );
	}

	/**
	 * Bind a new element to a validator
	 */
	bindElement( element, binding, vnode ) {
		let el = null;
		for ( let i = 0, len = this._inputElements.length; i<len; ++i ) {
			const item = this._inputElements[ i ];
			if ( item.$element === element ) {
				el = item;
				break;
			}
		}
		if ( !el ) {
			el = new InputElementValidator( element, this );
			this._inputElements.push( el );
		}
		el.update( binding, vnode );
	}
	/**
	 * Unbind the element
	 */
	unbindElement( element ) {
		const elements = [];
		for ( let i = 0, len = this._inputElements.length; i<len; ++i ) {
			const item = this._inputElements[ i ];
			if ( item.$element !== element )
				elements.push( element );
			else
				item.unbind();
		}
	}
	/**
	 * Validate all the elements on the input
	 */
	validateAll( validateChildren, state ) {
		this.$options.vue.set( this, '$errors', {} );
		state = state || {};
		const inputValidation = [];
		for ( let i = 0, len = this._inputElements.length; i<len; ++i )
			inputValidation.push( this._inputElements[ i ].validate( state ).then( noop, noop ) );
		
		return this.$options.Promise.all( inputValidation )
			.then(() => {
				if ( validateChildren === false )
					return null;
				
				const childValidation = [];
				for ( let i = 0, len = this.$childValidators.length; i<len; ++i )
					childValidation.push( this.$childValidators[ i ].validateAll( true, state ).then( noop, noop ) );
				return Promise.all( childValidation );
			}).then(function() {
				if ( state.errors ) {
					const err  = new Error;
					err.errors = state.errors;
					err.state  = state;
					throw err;
				}
				return state;
			})
		;
	}
	/**
	 * Set the error for the validate
	 */
	setError( name, error ) {
		this.$options.vue.set( this.$errors, name, error );
	}
	/**
	 * Check for error
	 */
	hasError( name ) {
		if ( this.$errors[ name ] != null )
			return true;
		for ( let i = 0, len = this.$childValidators.length; i<len; ++i )
			if ( this.$childValidators[ i ].hasError( name ) )
				return true;
		return false;
	}
	/**
	 * Destroy the validator
	 */
	_destroy() {
		this.$childValidators = [];
		for ( let i = 0, len = this.$parentValidator.$childValidators.length; i<len; ++i ) {
			const item = this.$parentValidator.$childValidators[ i ];
			if ( item === this ) {
				this.$parentValidator.$childValidators.splice( i, 1 );
				break;
			}	
		}

		for ( let i = 0, len = this._inputElements.length; i<len; ++i ) {
			const el = this._inputElements[ i ];
			el.unbind();
		}
		this._inputElements = [];
	}
};
// Noop util
function noop() {};
