import Rules from './Rules';

/**
 * Input validators
 */
export default class InputElementValidator {

	constructor( element, parentValidator ) {
		this.$element         = element;
		this.$parentValidator = parentValidator;
		this.$validation      = null;


		this.$unbind = null;
		this.onInput = this.onInput.bind( this );
	}

	get element() { return this.$element; }


	unbind() {
		if ( this.$unbind != null ) {
			this.$unbind();
			this.$unbind = null;
		}
			
	}

	bind( binding, vnode ) {
		if ( vnode.componentInstance ) {
			if ( this.$boundComponent === vnode.componentInstance )
				return;
			this.unbind();
			this.$boundComponent = vnode.componentInstance;
			vnode.componentInstance.$on( 'input', this.onInput );
			this.$unbind = () => {
				vnode.componentInstance.$off( 'input', this.onInput );
			};
		} else {
			if ( this.$boundComponent === this.$element )
				return;
			this.unbind();
			this.$boundComponent = this.$element;
			this.$element.addEventListener( 'input', this.onInput );
			this.$unbind = () => {
				this.$element.removeEventListener( 'input', this.onInput );
			};
		}
	}


	update( binding, vnode ) {
		this.bind( binding, vnode );
		
		let name = null;
		if ( vnode.componentInstance )
			name = vnode.componentInstance.name;
		if ( name == null ) {
			const el = this.$element.$el || this.$element;
			name = el.getAttribute( 'name' );
		}
		
		this.$name       = name;
		this.$validation = binding.value;
		this.validate();
	}

	onInput() {
		this.validate();
	}

	validate( state ) {
		const value = (this.$boundComponent && this.$boundComponent.value) || this.$element.value;
		const name  = this.$name;
		this.$parentValidator.setError( name, null );
		return Rules.validate( value, this.$validation, this.$parentValidator.$options )
			.then( ( result ) => {
				state.data = state.data || {};
				state.data[ name ] = result;
			}, ( err ) => {
				this.$parentValidator.setError( name, err );
				state.errors = state.errors || {};
				state.errors[ name ] = err;
				return Promise.reject( err );
			});
	}
	
}
