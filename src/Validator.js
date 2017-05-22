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
	setRule( name, rule ) {
		this.rules[name] = {
			name: name,
			rule: rule
		};
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
		
		const result = rule.rule( value );
		if ( result && result.then ) {
			let id = {};
			status.validationID = id;
			status.status = result.then(( r ) => {
				if ( status.validationID !== id )
					return status.status;
				if ( r === false ) {
					this.errors.$set( name, true, INPUT_TAG );
					status.status = 'error';
				} else {
					this.errors.$clear( name, INPUT_TAG );
					status.value  = value;
					status.status = 'success';
				}
				return status.status;
			}, ( err ) => {
				if ( status.validationID !== id )
					return status.status;
				this.errors.$set( name, err, INPUT_TAG );
				status.status = 'error';
				return status.status;
			});
			return status.status;
		} else if ( result === false ) {
			this.errors.$set( name, true, INPUT_TAG );
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