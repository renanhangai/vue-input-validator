vue-input-validator
=====================================

Validate inputs using vue

Setup
-------------------------
```js
import Vue from 'vue';
import VueInputValidator from 'vue-input-validator';
// import Promise from 'your-promise-lib';

Vue.use( VueInputValidator, { Promise } );
```

Basic Usage
----------------------

Simple
```html
<form @submit.prevent="submit">
	<input v-validate="'required'" name="name" />
	<div v-if="$errors.name">
		Invalid input
	</div>
</form>
```
```js
export default {
	// Creates a new scope for the validator
	validate: true; 
	// ....
	methods: {
		submit() {
			this.$validator.validate()
				.then(() => {
					// ... Do your thing
				}, () => {
					// Validation error
				})
			;
		}
	}
};
```


Rules
------------------------

Register a new validation rule

```js
/*
	If the rule returns false or throw, it is an error
	If the rule returns true | null | undefined. It is kept
	If the rule return anything else, it is kept on the chain and the 
	next rule will be called with that value
*/
// Register a number rule
VueInputValidator.registerRule( 'number', function( v ) {
    return parseInt(v, 10) == v;
});
```

