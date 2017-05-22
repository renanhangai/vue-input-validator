/**
 *
 */
export default class RuleSet {
	
	constructor() {
		this.rules = {};
	}

	register( name, rule ) {
		this.rules[ name ] = {
			name,
			rule
		};
	}

	getCallback( name ) {
		const r = this.rules[ name ];
		if ( !r )
			throw new Error( `Invalid rule "${name}"` );
		return r.rule;
	}

	parse( rule ) {
		const callbacks = this.parseInternal( rule );
		return this.makeCallbackChain( callbacks );
	}

	parseInternal( rule ) {
		let callbacks = [];
		if ( typeof(rule) === 'string' )
			callbacks = callbacks.concat( this.parseInternalString( rule ) );
		else if ( Array.isArray( rule ) ) {
			for ( let i = 0, len = rule.length; i<len; ++i )
				callbacks = callbacks.concat( this.parseInternal( rule ) );
		} else if ( typeof(rule) === 'function' ) {
			callbacks.push({
				callback: rule,
			});
		} else {
			throw new Error( "Invalid rule to parse: "+rule );
		}
		return callbacks;
	}

	parseInternalString( str ) {
		const rules     = str.split( "|" );
		const callbacks = [];
		for ( let i = 0, len = rules.length; i<len; ++i ) {
			const args = rules[ i ].split( ":" );
			const rule = args.shift();
			callbacks.push({
				args:     args,
				callback: this.getCallback( rule )
			});
		}
		return callbacks;
	}

	makeCallbackChain( callbacks ) {
		if ( !callbacks || callbacks.length <= 0 )
			return false;
		const continuation = function( value, data ) {
			if ( data.cancelled )
				return false;
			while ( data.i < callbacks.length ) {
				const c = callbacks[ data.i ];
				const args   = c.args || [];
				const result = c.callback.apply( null, [value].concat( args ) );
				data.current = result;
				if ( result === false )
					return false;
				else if ( result && result.then ) {
					return result.then(function() {
						data.i += 1;
						return continuation( value, data );
					});
				}
				++data.i;
			}
			return true;
		};
		continuation.cancel = function( data ) {
			if ( !data.cancelled ) {
				data.cancelled = true;
				if ( data.current && typeof(data.current.cancel) === 'function' )
					data.current.cancel();
			}
		};
		return function( v ) {
			const data = { cancelled: false, i: 0 };
			const r = continuation( v, data );
			if ( typeof(r) === 'object' ) {
				r.cancel = function() { continuation.cancel( data ); };
			}
			return r;
		};
	}
	
};
