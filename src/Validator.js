const INPUT_TAG = {};
export default class Validator {

	constructor( options ) {
		this.options         = options || {};
		this.rules           = {};
		this.status          = {};
		this.errors          = {};
		this.childValidators = [];
	}

	addRule( name, rule ) {
		this.rules[ name ] = {
			name: name,
			rule: rule
		};
	}

	clearError( name, tag ) {
		const status = this.status[ name ] = this.status[ name ] || {};
		if ( !status.errors )
			return;
		if ( !tag ) {
			if ( this.options.vue )
				this.options.vue.set( this.errors, name, false );
			else
				this.errors = false;
			status.errors = [];
			return;
		}
		
		const errors = [];
		for ( let i = 0, len = status.errors.length; i<len; ++i ) {
			let err = status.errors[ i ];
			if ( err.tag !== tag )
				errors.push( err );
		}
		status.errors = errors;

		if ( errors.length <= 0 ) {
			if ( this.options.vue )
				this.options.vue.set( this.errors, name, false );
			else
				this.errors = false;
			return;
		}
		
		errors.first = errors[0];
		if ( this.options.vue )
			this.options.vue.set( this.errors, name, errors );
		else
			this.errors[ name ] = errors;
	}

	setError( name, error, tag ) {
		const status = this.status[ name ] = this.status[ name ] || {};
		const errors = status.errors = status.errors || [];
		errors.push({
			name,
			tag,
			error
		});
		this.errors[ name ] = errors;
		errors.first        = errors[ 0 ];
	}
	
	setValue( name, value, check ) {
		let rule = this.rules[ name ];
		if ( !rule ) {
			for ( let i = 0, len = this.childValidators.length; i<len; ++i ) {
				let r = this.childValidators[ i ].setValue( name, value, false );
				if ( r != null )
					return r;
			}
			if ( check !== false )
				throw new Error( `Invalid field "${name}"` );
			return null;
		}
		
		const status = this.status[ name ] = this.status[ name ] || {};
		status.validationID = null;
		status.dirty        = true;
		status.value        = value;

		const result = rule.rule( value );
		if ( result && result.then ) {
			const id = {};
			status.validationID = id;
			status.status = result.then(( r ) => {
				if ( status.validationID !== id )
					return status.status;
				if ( r === false ) {
					status.status = false;
					this.setError( name, true, INPUT_TAG );
					return false;
				}
				status.status = true;
				this.clearError( name, INPUT_TAG );
				return true;
			}, ( err ) => {
				if ( status.validationID !== id )
					return status.status;
				status.status = false;
				this.setError( name, err, INPUT_TAG );
				return false;
			});
			return status.status;
		} else if ( result === false ) {
			status.status = false;
			this.setError( name, true, INPUT_TAG );
			return false;
		} else {
			status.status = true;
			this.clearError( name, INPUT_TAG );
			return true;
		}
	}

	validateAll() {
		let promises = [];
		const savedStatus = this.status;
		this.status = {};
		for ( let name in this.rules ) {
			const status = savedStatus[ name ] = savedStatus[ name ] || {};
			const result = this.setValue( name, status.value || '' );
			if ( result && result.then )
				promises.push( result );
		}
		return (this.options.Promise || Promise).all( promises )
			.then( () => {
				let hasErrors = false;
				const errors    = {};
				const values    = {};
				for ( let name in this.status ) {
					const s = this.status[ name ];
					let thisErrors = s.errors;
					if ( thisErrors && thisErrors.length > 0 ) {
						hasErrors = true;
						errors[ name ] = thisErrors;
					} else {
						values[ name ] = s.value;
					}
				}
				if ( hasErrors )
					throw new Error( errors );
				return values;
			});
	}
	
};
Object.defineProperty(Validator, 'INPUT_TAG', {
	writable:     false,
	configurable: false,
	value:        INPUT_TAG,
});
