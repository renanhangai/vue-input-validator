const $registered = {
	required( str ) { return !!str; }	 
};

export default class Rules {
	
	static register( name, rule ) {
		$registered[ name ] = rule;
	};

	static validate( value, rules, options ) {
		return new options.Promise(function( resolve ) {
			resolve( Rules._validate( value, rules, options ) );
		}).then(function( result ) {
			if ( ( result === false ) || ( result == null ) )
				throw new Error( "Invalid value" );
			else if ( result === true )
				return value;
			return result;
		});
	};
	static _validate( value, rules, options ) {
		if ( Array.isArray( rules ) ) {
			return Rules._validateArray( value, rules, options, 0 );
		} else if ( typeof(rules) === 'string' ) {
			rules = rules.split( "|" );
			for ( let i = 0, len = rules.length; i<len; ++i )
				rules[ i ] = rules[i].trim();
			if ( rules.length > 1 )
				return Rules._validateArray( value, rules, options, 0 );

			const newRule = $registered[ rules ];
			if ( newRule == null )
				throw new Error( `Invalid rule "${rules}"` );
			return Rules._validate( value, newRule, options );
		} else if ( typeof(rules) === 'function' ) {
			return rules( value );
		}
		throw new Error( "Invalid rule" );
	};
	static _validateArray( value, rules, options, offset ) {
		offset = offset | 0;
		return options.Promise.resolve( Rules._validate( value, rules[offset], options ) )
			.then(( result ) => {
				if ( ( result === false ) || ( result == null ) )
					throw new Error( "Invalid value" );
				else if ( result === true )
					result = value;
				return Rules._validateArray( result, rules, options, offset+1 );
			})
		;
	};
};
