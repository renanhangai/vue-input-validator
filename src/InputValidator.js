import InputElementValidator from './InputElementValidator';

/**
 * InputValidator
 */
export default class InputValidator {

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
			this._elements.push( el );
		}
		el.update( binding, vnode );
	}

	unbindElement( element ) {
		const elements = [];
		for ( let i = 0, len = this._inputElements.length; i<len; ++i ) {
			const item = this._inputElements[ i ];
			if ( item.$element !== element )
				elements.push( element );
		}
	}

	validateAll( validateChildren, state ) {
		state = state || {};
		const inputValidation = [];
		for ( let i = 0, len = this._inputElements.length; i<len; ++i )
			inputValidation.push( this._inputElements[ i ].validate( state ) );
		
		return this.$options.Promise.all( inputValidation )
			.then(() => {
				if ( validateChildren === false )
					return null;
				
				const childValidation = [];
				for ( let i = 0, len = this.$childValidators.length; i<len; ++i )
					childValidation.push( this.$childValidators[ i ].validateAll( true, state ) );
				return Promise.all( childValidation );
			})
		;
	}

	_destroy() {
		_.pull( this.$parentValidator.$childValidators, this );
	}
	
};
