import ErrorBag from './ErrorBag';

const INPUT_TAG = {};
export default class Validator {
	/**
	 * Construct
	 */
	constructor( parent, options ) {
		options = options || {};
		this.options = options;
		this.status = {};
		this.rules  = {};
		if ( options.vue )
			options.vue.util.defineReactive( this, 'errors', new ErrorBag( options ) );
		else
			this.errors = new ErrorBag( options );
		
	}
	/**
	 * Set a rule for a field on the validator
	 */
	setValidator( name, rule ) {
		this.rules[name] = {
			name: name,
			rule: rule
		};
		this.errors.$setRaw( name, false );
	}
	/**
	 * Set a rule for a field on the validator
	 */
	removeValidator( name ) {
		this.rules[name] = null;
	}
	/**
	 * Set an error for a field
	 */
	setError( name, error, options ) {
		const rule = this.rules[name];
		if ( !rule )
			return;

		const status = this.status[name] = this.status[name] || {};
		status.validationID = null;
		status.status = 'error';
		if ( options && options.clear === false )
			this.errors.$clear( name, INPUT_TAG );
		this.errors.$add( name, error, error && error.persistent ? null : INPUT_TAG );
	}
	/**
	 * Set the value for a field
	 */
	setValue( name, value ) {
		const rule   = this.rules[name];
		if ( !rule )
			return false;
		
		const status = this.status[name] = this.status[name] || {};
		this.errors.$clear( name, INPUT_TAG );
		status.validationID = null;
		if ( status.result && typeof(status.result.cancel) === 'function' )
			status.result.cancel();

		let result;
		let error = false;
		try {
			result = rule.rule( value );
		} catch( e ) {
			result = false;
			error  = e;
		}
		status.result = result;
		if ( result && result.then ) {
			let id = {};
			status.validationID = id;
			status.status = result.then(( r ) => {
				if ( status.validationID !== id )
					return null;
				if ( r === false ) {
					this.errors.$add( name, true, INPUT_TAG );
					status.status = 'error';
				} else {
					this.errors.$clear( name, INPUT_TAG );
					status.value  = value;
					status.status = 'success';
				}
				return status.status;
			}, ( err ) => {
				if ( status.validationID !== id )
					return null;
				this.errors.$add( name, err, INPUT_TAG );
				status.status = 'error';
				return status.status;
			});
			return status.status;
		} else if ( result === false ) {
			this.errors.$add( name, error || true, INPUT_TAG );
			status.status = 'error';
			return status.status;
		} else {
			this.errors.$clear( name, INPUT_TAG );
			status.value  = value;
			status.status = 'success';
			return status.status;
		}
	}
	/**
	 * Validate the current validator
	 */
	validate() {
		const p = this.options.Promise || Promise;
		const promises = [];
		for ( let name in this.rules ) {
			const rule   = this.rules[ name ];
			if ( !rule )
				continue;
			const status = this.status[name] = this.status[name] || {};
			const r      = this.setValue( name, status.value || '' );
			if ( r && r.then )
				promises.push( r );
		}
		return p.all( promises )
			.then(() => {
				const errors = {};
				const values = {};
				let   hasError = false;
				for ( let name in this.rules ) {
					const rule   = this.rules[ name ];
					if ( !rule )
						continue;
					
					const field = this.status[name] = this.status[name] || {};
					if ( field.status !== 'success' ) {
						errors[ name ] = this.errors[ name ];
						hasError       = true;
					} else {
						values[ name ] = field.value;
					}
				}
				if ( hasError )
					return p.reject( errors );
				return values;
			});
	}
	
};
Object.defineProperty(Validator, 'INPUT_TAG', {
	writable:     false,
	configurable: false,
	value:        INPUT_TAG,
});
