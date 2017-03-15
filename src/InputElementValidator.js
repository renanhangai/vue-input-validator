import Rules from './Rules';

/**

 Single element input validator

 */
export default class InputElementValidator {

	/// Construct the validator
	constructor( element, parentValidator ) {
		this.$element         = element;
		this.$parentValidator = parentValidator;
		this.$validation      = null;


		this.$unbind = null;
		this.onInput = this.onInput.bind( this );
	}

	/// Readonly element
	get element() { return this.$element; }
	/**
	 * Ubind
	 */
	unbind() {
		if ( this.$unbind != null ) {
			this.$unbind();
			this.$unbind = null;
		}		
	}
	/**
	 * Rebind the element
	 */
	bind( binding, vnode ) {
		if ( vnode.componentInstance ) {
			if ( this.$boundComponent === vnode.componentInstance )
				return;
			this.unbind();
			this.$boundComponent = vnode.componentInstance;

			const comp = vnode.componentInstance;
			comp.$on( 'input', this.onInput );
			this.$unbind = () => {
				comp.$off( 'input', this.onInput );
			};
		} else {
			if ( this.$boundComponent === this.$element )
				return;
			this.unbind();
			this.$boundComponent = this.$element;

			const el = this.$element;
			el.addEventListener( 'input', this.onInput );
			this.$unbind = () => {
				el.removeEventListener( 'input', this.onInput );
			};
		}
	}
	/**
	 * Update the element bindings
	 */
	update( binding, vnode ) {
		this.bind( binding, vnode );
		
		let name = null;
		if ( vnode.componentInstance )
			name = vnode.componentInstance.name;
		if ( name == null ) {
			const el = this.$element.$el || this.$element;
			name = el.getAttribute( 'name' );
		}
		if ( this.$name != null )
			this.$parentValidator.setError( this.$name, null );
		this.$name       = name;
		this.$validation = binding.value;
		this.validate().then(noop, noop);
	}
	/**
	 * Input event
	 */
	onInput() {
		setTimeout( () => {
			this.validate().then(noop, noop);
		}, 0);
	}
	/**
	 * Validate the field on the state
	 */
	validate( state, value ) {
		state = state || {};
		if ( value == null )
			value = (this.$boundComponent && this.$boundComponent.value) || this.$element.value;
		const name  = this.$name;

		this.$id    = {};
		const id    = this.$id;
		this.$parentValidator.setError( name, null );
		return Rules.validate( value, this.$validation, this.$parentValidator.$options )
			.then( ( result ) => {
				if ( id !== this.$id )
					return;
				state.data = state.data || {};
				state.data[ name ] = result;
			}, ( err ) => {
				if ( id !== this.$id )
					return null;
				this.$parentValidator.setError( name, err );
				state.errors = state.errors || {};
				state.errors[ name ] = err;
				return Promise.reject( err );
			})
		;
	}
	
}
// Noop
function noop() {};
