export default class ErrorBag {

	constructor( options ) {
		this.$setup( options );
	}

	$setup( options ) {
		const $internal = Object.freeze({
			options:  options || {},
			errors:   {},
		});
		Object.defineProperty( this, '$internal', {
			writable: false,
			enumerable: false,
			configurable: false,
			value: $internal
		});
	}
	
	$clear( name, tag ) {
		const errors = this.$internal.errors[ name ];
		if ( !errors || errors.length <= 0 )
			return;

		let newErrors = [];
		if ( tag ) {
			for ( let i = 0, len = errors.length; i<len; ++i ) {
				const err = errors[i];
				if ( tag !== err.tag )
					newErrors.push( err );
			}
		}
		this.$setRaw( name, newErrors );
	}

	$update( name ) {
		const errors = this.$internal.errors[ name ];
		let errorView;
		if ( !errors || errors.length <= 0 )
			errorView = false;
		else {
			errorView = [];
			for ( let i = 0, len = errors.length; i<len; ++i ) {
				errorView.push( ErrorBag.errorAsString( errors[i] ) );
			}
			errorView.first = errorView[ 0 ];
		}
		if ( this.$internal.options.vue )
			this.$internal.options.vue.set( this, name, errorView );
		else
			this[ name ] = errorView;
	}

	$set( name, error, tag ) {	
		const errors = this[ name ] || [];
		errors.push({ name, error, tag });
		this.$setRaw( name, errors );
	}
	
	$setRaw( name, errors ) {
		if ( errors )
			errors = [].concat( errors );
		this.$internal.errors[ name ] = errors;
		this.$update( name );
	}

	$any() {
		for ( let key in this.$internal.errors ) {
			const errors = this.$internal.errors[ key ];
			if ( errors && errors.length > 0 )
				return true;
		}
		return false;
	}
	
	static errorAsString( error ) {
		if ( typeof(error) === 'string' )
			return error;
		return "";
	}
	
};
