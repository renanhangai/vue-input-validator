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
	<div v-if="$inputValidator.hasError( 'name' )">
		Invalid input
	</div>
</form>
```
```js
export default {
	// Creates a new scope for the validator
	validatorScope: true; 
	// ....
	methods: {
		submit() {
			this.$inputValidator.validateAll()
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
