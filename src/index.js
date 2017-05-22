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
				const rule = ruleset.parse( binding.value );
				validator.bindElement( rule, el, binding, vnode );
			},
			update( el, binding, vnode ) {
				const validator = vnode.context.$validator;
				const rule      = ruleset.parse( binding.value );
				validator.updateElement( rule, el, binding, vnode );
			},
			unbind( el, binding, vnode ) {
				const validator = vnode.context.$validator;
				validator.unbindElement( el, binding, vnode );
			},
		});

		// Set the validator
		Object.defineProperty( vue.prototype, '$validator', {
			get: function() {
				let validator = null;
				if ( this.$options.validate === true ) {
					const parentValidator = this.$parent ? this.$parent.$validator : null;
					validator = new Validator( parentValidator, { vue, Promise: options.Promise } );
				} else if ( this.$options.validate === 'inherit' ) {
					validator = this.$parent ? this.$parent.$validator : null;
					if ( !validator )
						throw new Error( "Invalid parent validator to inherit" );
				}

				if ( validator ) {
					Object.defineProperty( this, '$validator', {
						value:        validator,
					});
					Object.defineProperty( this, '$validatorOwn', {
						value: true,
					});
					return validator;
				}
				return this.$parent && this.$parent.$validator;
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
