import ErrorBag from './ErrorBag';

const INPUT_TAG = {};
export default class Validator {

	constructor( parent, options ) {
		options = options || {};
		this.status = {};
		this.rules  = {};
		if ( options.vue )
			options.vue.util.defineReactive( this, 'errors', new ErrorBag( options ) );
		else
			this.errors = new ErrorBag( options );
		
	}

	setRule( name, rule ) {
		this.rules[name] = {
			name: name,
			rule: rule
		};
	}

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
			status.status = 'success';
			return status.status;
		}
	}
	
};
Object.defineProperty(Validator, 'INPUT_TAG', {
	writable:     false,
	configurable: false,
	value:        INPUT_TAG,
});
