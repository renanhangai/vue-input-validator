const $registered = {
	required( str ) { return !!str; }	 
};

export default class Rules {
	
	static register( name, rule ) {
		$registered[ name ] = rule;
	};
	/**
	 *
	 */
	static validate( value, rules, options ) {
		const state = {
			initial: value,
		};
		return new options.Promise(function( resolve ) {
			resolve( Rules._validate( value, rules, options, state ) );
		}).then(function( result ) {
			if ( ( result === false ) || ( result == null ) )
				throw new Error( "Invalid value" );
			else if ( result === true )
				return value;
			return result;
		});
	};
	/**
	 *
	 */
	static _validate( value, rules, options, state, data ) {
		if ( Array.isArray( rules ) ) {
			return Rules._validateArray( value, rules, options, state, {}, 0 );
		} else if ( typeof(rules) === 'string' ) {
			rules = trimMap( rules.split( "|" ) );
			if ( rules.length > 1 )
				return Rules._validateArray( value, rules, options, state, {}, 0 );

			const args = trimMap( rules.split(":") );
			const newRule = $registered[ args[0] ];
			if ( newRule == null )
				throw new Error( `Invalid rule "${rules}"` );
			return Rules._validate( value, newRule, options, state, { args: args.slice(1) } );
		} else if ( typeof(rules) === 'function' ) {
			const args = [value].concat(( data && data.args ) || []);
			return rules.apply( null, args );
		}
		throw new Error( "Invalid rule" );
	};
	/**
	 * Validate an array of objects
	 */
	static _validateArray( value, rules, options, state, data, offset ) {
		offset = offset | 0;
		return options.Promise.resolve( Rules._validate( value, rules[offset], options, state, data ) )
			.then(( result ) => {
				if ( ( result === false ) || ( result == null ) )
					throw new Error( "Invalid value" );
				else if ( result === true )
					result = value;
				return Rules._validateArray( result, rules, options, state, data, offset+1 );
			})
		;
	};
};

function trimMap( map ) {
	for ( let i = 0, len = map.length; i<len; ++i )
		map[ i ] = map[i].trim();
	return map;
}
