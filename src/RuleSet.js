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
		let i = 0;
		const continuation = function( value, i ) {
			i = i|0;
			while ( i < callbacks.length ) {
				const c = callbacks[ i ];
				const args   = c.args || [];
				const result = c.callback.apply( null, [value].concat( args ) );
				if ( result === false )
					return false;
				else if ( result && result.then ) {
					return result.then(function() {
						return continuation( value, i+1 );
					});
				}
				++i;
			}
			return true;
		};
		return function( v ) {
			return continuation( v, 0 );
		};
	}
	
};
