import InputValidator from './InputValidator';
import Rules from './Rules';

export default {
	
	install( vue, options ) {
		options = {
			Promise: options.Promise || Promise
		};
		vue.directive( 'validate', {
			bind( el, binding, vnode ) {
				vnode.context.$inputValidator.bindElement( el, binding, vnode );
			},
			update( el, binding, vnode ) {
				vnode.context.$inputValidator.bindElement( el, binding, vnode );
			},
			unbind( el, binding, vnode ) {
				vnode.context.$inputValidator.unbindElement( el );
			}
		});

		// Create $inputValidator 
		vue.mixin({
			created() {
				if ( this.$options.validateScope ) {
					Object.defineProperty( this, '$inputValidator', { value: new InputValidator( this, this.$inputValidator, options ) });
				}
			},
			destroyed() {
				if ( this.hasOwnProperty( '$inputValidator' ) ) {
					this.$inputValidator._destroy();
					delete this.$inputValidator;
				}
			}
		});

		// Input validator
		Object.defineProperty( vue.prototype, '$inputValidator', {
			configurable: true,
			get: function() {
				if ( this.$parent )
					return this.$parent.$inputValidator;

				const v = new InputValidator( this, null, options );
				Object.defineProperty( this, '$inputValidator', {
					value: v
				});
				return v;
			}
		});

	},
	registerRule( name, rule ) {
		Rules.register( name, rule );
	}
	
};
