import Validator from './Validator';

export default {
	install( vue, options ) {
		options = options || {};

		const name = options.directive || "validate";
		vue.directive( name, {
			bind( el, binding, vnode ) {
				const name = el.getAttribute( "name" );
				vnode.context.$validator.setRule( name, binding.value );
				if ( ( !binding.modifiers.dirty ) && ( el.value ) )
					vnode.context.$validator.setValue( name, el.value );

				const evt = binding.arg || 'input';
				el.addEventListener( evt, function( ev ) {
					vnode.context.$validator.setValue( name, ev.target.value );
				});
			}
		});

		// Set the validator
		Object.defineProperty( vue.prototype, '$validator', {
			get: function() {
				if ( ( this.$root === this ) || ( this.$options.validate ) ) {
					const parentValidator = this.$parent ? this.$parent.$validator : null;
					const validator = new Validator( parentValidator, { vue } );
					Object.defineProperty( this, '$validator', {
						value:        validator,
					});
					return validator;
				}
				return this.$parent.$validator;
			}
		});

		Object.defineProperty( vue.prototype, '$errors', {
			get: function() {
				return this.$validator.errors;
			}
		});
	},
};
