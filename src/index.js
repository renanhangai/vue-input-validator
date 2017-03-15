import InputValidator from './InputValidator';
import Rules from './Rules';

export default {
	
	install( vue, options ) {
		options = {
			vue: vue,
			Promise: options.Promise || Promise
		};
		vue.directive( 'validate', {
			bind( el, binding, vnode ) {
				vnode.context.$inputValidator.bindElement( el, binding, vnode );
			},
			updated( el, binding, vnode ) {
				vnode.context.$inputValidator.bindElement( el, binding, vnode );
			},
			unbind( el, binding, vnode ) {
				if ( vnode.context.$inputValidator )
					vnode.context.$inputValidator.unbindElement( el );
			}
		});

		// Create $inputValidator 
		vue.mixin({
			created() {
				let v = null;
				if ( !this.$parent ) 
					v = new InputValidator( this, null, options );
				else if ( this.$options.validateScope )
					v = new InputValidator( this, this.$parent.$inputValidator, options );
				
				if ( v != null ) {
					vue.util.defineReactive( this, '$inputValidator', v );
					v.setup();
				} else
					vue.util.defineReactive( this, '$inputValidator', this.$parent.$inputValidator );

			},
			destroyed() {
				if ( this.hasOwnProperty( '$inputValidator' ) ) {
					this.$inputValidator._destroy();
					delete this.$inputValidator;
				}
			}
		});
	},
	registerRule( name, rule ) {
		Rules.register( name, rule );
	}
	
};
