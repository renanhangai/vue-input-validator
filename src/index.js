import Validator from './Validator';
import RuleSet   from './RuleSet';

const ruleset = new RuleSet;

export default {
	registerRule( name, rule ) {
		ruleset.register( name, rule );
	},
	install( vue, options ) {
		options = options || {};

		const name = options.directive || "validate";
		vue.directive( name, {
			bind( el, binding, vnode ) {
				const validator = vnode.context.$validator;
				if ( !vnode.context.$validatorOwn )
					throw new Error( `Invalid validator context.\nDid you set validate: true on the root context component? ${vnode.context.name}` );
				
				const isNative = (binding.modifiers.native || !vnode.componentInstance);
				
				const name = getValidatorName( el, binding, vnode, isNative );
				if ( !name )
					throw new Error( `Missing attribute name on validator` );
				validator.setValidator( name, ruleset.parse( binding.value ) );
				
				const evt = binding.arg || 'input';
				if ( isNative ) {
					if ( ( !binding.modifiers.dirty ) && ( el.value ) )
						validator.setValue( name, el.value );
					el.addEventListener( evt, function( ev ) {
						validator.setValue( name, getEventValue( ev ) );
					});
				} else {
					vnode.componentInstance.$on( evt, function( ev ) {
						validator.setValue( name, getEventValue( ev ) );
					});
				}
			}
		});

		// Get the name for the validator
		function getValidatorName( el, binding, vnode, isNative ) {
			if ( !isNative ) {
				const instance = vnode.componentInstance;
				if ( instance && instance.$props && instance.$props.name )
					return instance.$props.name;
			}
			return el.getAttribute( "name" );
		}

		function getEventValue( ev ) {
			if ( ev.target && (ev.target.value != null))
				return ev.target.value;
			return ev;
		}

		// Set the validator
		Object.defineProperty( vue.prototype, '$validator', {
			get: function() {
				if ( this.$options.validate === true ) {
					const parentValidator = this.$parent ? this.$parent.$validator : null;
					const validator = new Validator( parentValidator, { vue, Promise: options.Promise } );
					Object.defineProperty( this, '$validator', {
						value:        validator,
					});
					Object.defineProperty( this, '$validatorOwn', {
						value: true,
					});
					return validator;
				} else if ( this.$options.validate === 'inherit' ) {
					const validator = this.$parent ? this.$parent.$validator : null;
					if ( !validator )
						throw new Error( "Invalid parent validator to inherit" );
					Object.defineProperty( this, '$validator', {
						value: validator,
					});
					Object.defineProperty( this, '$validatorOwn', {
						value: true,
					});
					return validator;
				}

				return this.$parent.$validator;
			}
		});

		// Invalid validator
		Object.defineProperty( vue.prototype, '$errors', {
			get: function() {
				return this.$validator.errors;
			}
		});
	},
};
