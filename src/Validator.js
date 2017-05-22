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
			this.setValue( name, getEventValue( ev ) );
		});
		this.rules[data.name] = {
			name:      data.name,
			rule:      rule,
			autoclean: !!binding.modifiers.autoclean,
		};
		this.elementsStorage.set( el, data );
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
					status.error  = true;
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
				status.error  = err;
				status.status = 'error';
				return status.status;
			});
			return status.status;
		} else if ( result === false ) {
			this.errors.$add( name, error || true, INPUT_TAG );
			status.error  = error;
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
