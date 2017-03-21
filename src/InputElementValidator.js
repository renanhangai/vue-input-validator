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
				return false;
			this.unbind();
			this.$boundComponent = vnode.componentInstance;

			const comp = vnode.componentInstance;
			comp.$on( 'input', this.onInput );
			this.$unbind = () => {
				comp.$off( 'input', this.onInput );
			};
		} else {
			if ( this.$boundComponent === this.$element )
				return false;
			this.unbind();
			this.$boundComponent = this.$element;

			const el = this.$element;
			el.addEventListener( 'input', this.onInput );
			this.$unbind = () => {
				el.removeEventListener( 'input', this.onInput );
			};
		}
		return true;
	}
	/**
	 * Update the element bindings
	 */
	update( binding, vnode ) {
		if ( !this.bind( binding, vnode ) )
			return;
		
		let name = null;
		if ( vnode.componentInstance )
			name = vnode.componentInstance.name;
		if ( name == null ) {
			const el = this.$element.$el || this.$element;
			name = el.getAttribute( 'name' );
		}
		if ( this.$name != null )
			this.$parentValidator.setState( this.$name, null );
		this.$name       = name;
		this.$validation = binding.value;
		this.validate().then(noop, noop);
	}
	/**
	 * Input event
	 */
	onInput() {
		setTimeout( () => {
			this.validate( null, 'input' ).then(noop, noop);
		}, 0);
	}
	/**
	 * Validate the field on the state
	 */
	validate( state, dirty ) {
		state = state || {};
		const value = (this.$boundComponent && this.$boundComponent.value) || this.$element.value;
		const name  = this.$name;

		this.$id    = {};
		const id    = this.$id;
		this.$parentValidator.setState( name, {
			dirty: (dirty === 'input') ? (!!value) : (!!dirty)
		} );
		return Rules.validate( value, this.$validation, this.$parentValidator.$options )
			.then( ( result ) => {
				if ( id !== this.$id )
					return;
				state.data = state.data || {};
				state.data[ name ] = result;
			}, ( err ) => {
				if ( id !== this.$id )
					return null;
				this.$parentValidator.setState( name, { errors: err } );
				state.errors = state.errors || {};
				state.errors[ name ] = err;
				throw err;
			})
		;
	}
	
}
// Noop
function noop() {};
