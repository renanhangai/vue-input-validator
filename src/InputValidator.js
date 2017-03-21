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
		this.$options.vue.util.defineReactive( this, '$states', {} );
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
		this.$options.vue.set( this, '$states', {} );
		state = state || {};
		const inputValidation = [];
		for ( let i = 0, len = this._inputElements.length; i<len; ++i )
			inputValidation.push( this._inputElements[ i ].validate( state, true ).then( noop, noop ) );
		
		return this.$options.Promise.all( inputValidation )
			.then(() => {
				if ( validateChildren === false )
					return null;
				
				const childValidation = [];
				for ( let i = 0, len = this.$childValidators.length; i<len; ++i )
					childValidation.push( this.$childValidators[ i ].validateAll( true, state ).then( noop, noop ) );
				return this.$options.Promise.all( childValidation );
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
	setState( name, state ) {
		if ( !state ) {
			this.$options.vue.set( this.$states, name, null );
			return;
		}
		const old = this.$states[ name ];
		this.$options.vue.set( this.$states, name, {
			dirty:  (old && old.dirty) || state.dirty,
			errors: state.errors,
			errorsTimestamp: state.errors ? Date.now() : null
		});
	}
	/**
	 * Remark the field as pure
	 */
	setPristine( name ) {
		const old = this.$states[ name ];
		if ( old && old.dirty ) {
			this.$options.vue.set( this.$states, name, {
				dirty:  false,
				errors: old.errors
			});
		}
	}
	/**
	 * Remark all the fields as pure
	 */
	setPristineAll() {
		this.$options.vue.set( this, '$states', {} );
	}
	/**
	 * Check for error
	 */
	hasError( name, debounce ) {
		const state = this.getState( name );
		if ( state == null )
			return false;
		const hasError = ( state.dirty && state.errors );
		if ( !hasError )
			return false;
		
		if ( debounce == null || !state.errorsTimestamp )
			return true;
		
		debounce = debounce|0;
		return Date.now() >= (state.errorsTimestamp+debounce);
	}
	/**
	 * Get a state
	 */
	getState( name ) {
		const state = this.$states[ name ];
		if ( state != null )
			return state;
		for ( let i = 0, len = this.$childValidators.length; i<len; ++i ) {
			const childState = this.$childValidators[ i ].getState( name );
			if ( childState != null )
				return childState;
		}
		return null;
	}
	/**
	 * Destroy the validator
	 */
	_destroy() {
		this.$childValidators = [];
		if ( this.$parentValidator ) {
			for ( let i = 0, len = this.$parentValidator.$childValidators.length; i<len; ++i ) {
				const item = this.$parentValidator.$childValidators[ i ];
				if ( item === this ) {
					this.$parentValidator.$childValidators.splice( i, 1 );
					break;
				}	
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
