import ErrorBag from './ErrorBag';

const INPUT_TAG = {};
export default class Validator {
	/**
	 * Construct
	 */
	constructor( parent, options ) {
		options = options || {};
		this.options = options;
		this.status  = {};
		this.rules   = {};
		this.elementsStorage = new (options.WeakMap || WeakMap);
		if ( options.vue )
			options.vue.util.defineReactive( this, 'errors', new ErrorBag( options ) );
		else
			this.errors = new ErrorBag( options );
	}
	/**
	 * Set the validator as not dirty
	 */
	setPristine( set ) {
		if ( set == null ) {
			for ( let key in this.status )
				this.status[ key ].dirty = false;
		} else {
			for ( let i = 0, len = set.length; i<len; ++i ) {
				const name   = set[ i ];
				const status = this.status[ name ];
				if ( status )
					status.dirty = false;
			}
		}
	}
	/**
	 * Clear validator errors
	 */
	clear( set ) {
		if ( set == null ) {
			for ( let key in this.status ) {
				this.status[ key ] = {};
				this.errors.$clear( key, INPUT_TAG );
			}
		} else {
			for ( let i = 0, len = set.length; i<len; ++i ) {
				const key = set[ i ];
				this.status[ key ] = {};
				this.errors.$clear( key, INPUT_TAG );
			}
		}
	}
	/**
	 * Bind a validator
	 */
	bindElement( rule, el, binding, vnode ) {
		const isNative = (binding.modifiers.native || !vnode.componentInstance);
		
		const name = getValidatorName( el, binding, vnode, isNative );
		if ( !name )
			throw new Error( `Missing attribute name on validator` );

		const evt = binding.arg || 'input';

		const cleanup = [];
		const data = {
			name:    name,
			value:   binding.value,
			native:  isNative,
			event:   evt,
			unbind() {
				for ( let i = 0, len = cleanup.length; i<len; ++i )
					cleanup[ i ].call();
			},
		};


		const comp    = isNative ? el : vnode.componentInstance;
		if ( evt !== 'input' ) {
			addEvent( cleanup, comp, 'input', ( ev ) => {
				this.errors.$clear( name, INPUT_TAG );
			});
		}
		addEvent( cleanup, comp, evt, ( ev ) => {
			this.setValue( name, getEventValue( ev ), true );
		});
		const ruledata = this.rules[data.name] = {
			name:      data.name,
			rule:      rule,
			optional:  !!binding.modifiers.optional,
			dirty:     !!binding.modifiers.dirty,
		};
		if ( isNative )
			ruledata.getValue = function() { return el.value; };
		else
			ruledata.getValue = function() { return comp.value; };
		this.elementsStorage.set( el, data );
		const status = this.status[name] = {};
		if ( ruledata.dirty )
			status.dirty = true;
	}
	/**
	 * Update an element
	 */
	updateElement( rule, el, binding, vnode ) {
		const data = this.elementsStorage.get( el );
		if ( !data ) {
			this.bindElement( rule, el, binding, vnode );
			return;
		}
		
		const name = getValidatorName( el, binding, vnode, data.native );
		if ( ( data.name !== name ) || ( data.value !== binding.value ) ) {
			const oldStatus = this.status[data.name];
			const oldErrors = this.errors.$getRaw( data.name );
			this.unbindElement( el );
			this.bindElement( rule, el, binding, vnode );
			this.status[ name ] = oldStatus;
			this.errors.$setRaw( name, oldErrors );
		}
	}
	/**
	 * Unbind an element
	 */
	unbindElement( el ) {
		const data = this.elementsStorage.get( el );
		if ( !data )
			return;
		const name = data.name;
		this.rules[name] = null;
		this.status[name] = null;
		this.errors.$remove( name );
		data.unbind();
		this.elementsStorage.delete( el );
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
	setValue( name, value, keepDirty ) {
		// No rule
		const rule   = this.rules[name];
		if ( !rule )
			return false;
		
		const status = this.status[name] = this.status[name] || {};
		if ( !status.dirty && !value && keepDirty )
			return false;
		status.dirty = true;

		// Functions
		const setSuccess = ( value ) => {
			this.errors.$clear( name, INPUT_TAG );
			status.value  = value;
			status.status = 'success';
			status.result = null;
			return status.status;
		};
		const setError = ( err ) => {
			err = err || true;
			this.errors.$add( name, err, INPUT_TAG );
			status.error  = err;
			status.status = 'error';
			status.result = null;
			return status.status;
		};


		
		this.errors.$clear( name, INPUT_TAG );
		status.validationID = null;
		if ( status.result && typeof(status.result.cancel) === 'function' )
			status.result.cancel();

		// Optional rule
		if ( !value && rule.optional )
			return setSuccess( '' );

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
				return ( r === false ) ? setError() : setSuccess( value );
			}, ( err ) => {
				if ( status.validationID !== id )
					return null;
				return setError( err );
			});
			return status.status;
		} else if ( result === false ) {
			return setError( error );
		} else {
			return setSuccess( value );
		}

	}
	/**
	 * Validate the current fields
	 */
	validate( set ) {
		const p = this.options.Promise || Promise;
		const promises = [];
		if ( set == null ) {
			set = [];
			for ( let name in this.rules ) {
				if ( !this.rules[ name ] )
					continue;
				set.push( name );
			}
		}
		
		for ( let i = 0, len = set.length; i<len; ++i ) {
			const name = set[ i ];
			const rule = this.rules[ name ];
			if ( !rule )
				throw new Error( `Unknown field "${name}"` );
			const value  = rule.getValue();
			const r      = this.setValue( name, value || '' );
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

					const error = this.errors[ name ];
					const field = this.status[name] || {};
					if ( error || ( field.status !== 'success' ) ) {
						errors[ name ] = error;
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


// Get the name for the validator
function getValidatorName( el, binding, vnode, isNative ) {
	const instance = vnode.componentInstance;
	if ( instance && instance.$props && instance.$props.name )
		return instance.$props.name;
	return el.getAttribute( "name" );
}

function getEventValue( ev ) {
	if ( ev.target && (ev.target.value != null))
		return ev.target.value;
	return ev;
}

function addEvent( cleanup, obj, evt, cb ) {
	let onOff = (typeof(obj.$on) === 'function');
	if ( onOff ) {
		obj.$on( evt, cb );
		cleanup.push(function() {
			obj.$off( evt, cb );
		});
	} else {
		obj.addEventListener( evt, cb );
		cleanup.push(function() {
			obj.removeEventListener( evt, cb );
		});
	}
}
