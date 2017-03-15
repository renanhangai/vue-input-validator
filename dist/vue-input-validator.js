(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.VueInputValidator = factory());
}(this, (function () { 'use strict';

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var $registered = {
	required: function required(str) {
		return !!str;
	}
};

var Rules = function () {
	function Rules() {
		classCallCheck(this, Rules);
	}

	createClass(Rules, null, [{
		key: "register",
		value: function register(name, rule) {
			$registered[name] = rule;
		}
	}, {
		key: "validate",

		/**
   *
   */
		value: function validate(value, rules, options) {
			var state = {
				initial: value
			};
			return new options.Promise(function (resolve) {
				resolve(Rules._validate(value, rules, options, state));
			}).then(function (result) {
				if (result === false) throw new Error("Invalid value");else if (result === true || result == null) return value;
				return result;
			});
		}
	}, {
		key: "_validate",

		/**
   *
   */
		value: function _validate(value, rules, options, state, data) {
			if (Array.isArray(rules)) {
				return Rules._validateArray(value, rules, options, state, {}, 0);
			} else if (typeof rules === 'string') {
				rules = trimMap(rules.split("|"));
				if (rules.length > 1) return Rules._validateArray(value, rules, options, state, {}, 0);
				rules = rules[0];

				var args = trimMap(rules.split(":"));
				var newRule = $registered[args[0]];
				if (newRule == null) throw new Error("Invalid rule \"" + rules + "\"");
				return Rules._validate(value, newRule, options, state, { args: args.slice(1) });
			} else if (typeof rules === 'function') {
				var _args = [value].concat(data && data.args || []);
				return rules.apply(null, _args);
			}
			throw new Error("Invalid rule");
		}
	}, {
		key: "_validateArray",

		/**
   * Validate an array of objects
   */
		value: function _validateArray(value, rules, options, state, data, offset) {
			offset = offset | 0;
			if (offset >= rules.length) return value;
			return options.Promise.resolve(Rules._validate(value, rules[offset], options, state, data)).then(function (result) {
				if (result === false) throw new Error("Invalid value");else if (result === true || result == null) result = value;
				return Rules._validateArray(result, rules, options, state, data, offset + 1);
			});
		}
	}]);
	return Rules;
}();



function trimMap(map) {
	for (var i = 0, len = map.length; i < len; ++i) {
		map[i] = map[i].trim();
	}return map;
}

/**

 Single element input validator

 */

var InputElementValidator = function () {

	/// Construct the validator
	function InputElementValidator(element, parentValidator) {
		classCallCheck(this, InputElementValidator);

		this.$element = element;
		this.$parentValidator = parentValidator;
		this.$validation = null;

		this.$unbind = null;
		this.onInput = this.onInput.bind(this);
	}

	/// Readonly element


	createClass(InputElementValidator, [{
		key: 'unbind',

		/**
   * Ubind
   */
		value: function unbind() {
			if (this.$unbind != null) {
				this.$unbind();
				this.$unbind = null;
			}
		}
		/**
   * Rebind the element
   */

	}, {
		key: 'bind',
		value: function bind(binding, vnode) {
			var _this = this;

			if (vnode.componentInstance) {
				if (this.$boundComponent === vnode.componentInstance) return;
				this.unbind();
				this.$boundComponent = vnode.componentInstance;

				var comp = vnode.componentInstance;
				comp.$on('input', this.onInput);
				this.$unbind = function () {
					comp.$off('input', _this.onInput);
				};
			} else {
				if (this.$boundComponent === this.$element) return;
				this.unbind();
				this.$boundComponent = this.$element;

				var el = this.$element;
				el.addEventListener('input', this.onInput);
				this.$unbind = function () {
					el.removeEventListener('input', _this.onInput);
				};
			}
		}
		/**
   * Update the element bindings
   */

	}, {
		key: 'update',
		value: function update(binding, vnode) {
			this.bind(binding, vnode);

			var name = null;
			if (vnode.componentInstance) name = vnode.componentInstance.name;
			if (name == null) {
				var el = this.$element.$el || this.$element;
				name = el.getAttribute('name');
			}
			if (this.$name != null) this.$parentValidator.setState(this.$name, null);
			this.$name = name;
			this.$validation = binding.value;
			this.validate().then(noop$1, noop$1);
		}
		/**
   * Input event
   */

	}, {
		key: 'onInput',
		value: function onInput() {
			var _this2 = this;

			setTimeout(function () {
				_this2.validate(null, 'input').then(noop$1, noop$1);
			}, 0);
		}
		/**
   * Validate the field on the state
   */

	}, {
		key: 'validate',
		value: function validate(state, dirty) {
			var _this3 = this;

			state = state || {};
			var value = this.$boundComponent && this.$boundComponent.value || this.$element.value;
			var name = this.$name;

			this.$id = {};
			var id = this.$id;
			this.$parentValidator.setState(name, {
				dirty: dirty === 'input' ? !!value : !!dirty
			});
			return Rules.validate(value, this.$validation, this.$parentValidator.$options).then(function (result) {
				if (id !== _this3.$id) return;
				state.data = state.data || {};
				state.data[name] = result;
			}, function (err) {
				if (id !== _this3.$id) return null;
				_this3.$parentValidator.setState(name, { errors: err });
				state.errors = state.errors || {};
				state.errors[name] = err;
				return Promise.reject(err);
			});
		}
	}, {
		key: 'element',
		get: function get$$1() {
			return this.$element;
		}
	}]);
	return InputElementValidator;
}();
function noop$1() {}

/**
 
 InputValidator

 This class will bind to a group of inputs and validate then all

 */

var InputValidator = function () {
	/**
  * Construct this validator
 	 */
	function InputValidator(component, parentValidator, options) {
		classCallCheck(this, InputValidator);

		this.$component = component;
		this.$parentValidator = parentValidator;
		this.$options = options;
		this.$childValidators = [];

		this.$rootValidator = this;
		if (this.$parentValidator) {
			this.$rootValidator = this.$parentValidator.$rootValidator;
			this.$parentValidator.$childValidators.push(this);
		}

		this._inputElements = [];
	}

	/**
  * Setup elements after defining reactive
  */


	createClass(InputValidator, [{
		key: 'setup',
		value: function setup() {
			this.$options.vue.util.defineReactive(this, '$states', {});
		}

		/**
   * Bind a new element to a validator
   */

	}, {
		key: 'bindElement',
		value: function bindElement(element, binding, vnode) {
			var el = null;
			for (var i = 0, len = this._inputElements.length; i < len; ++i) {
				var item = this._inputElements[i];
				if (item.$element === element) {
					el = item;
					break;
				}
			}
			if (!el) {
				el = new InputElementValidator(element, this);
				this._inputElements.push(el);
			}
			el.update(binding, vnode);
		}
		/**
   * Unbind the element
   */

	}, {
		key: 'unbindElement',
		value: function unbindElement(element) {
			var elements = [];
			for (var i = 0, len = this._inputElements.length; i < len; ++i) {
				var item = this._inputElements[i];
				if (item.$element !== element) elements.push(element);else item.unbind();
			}
		}
		/**
   * Validate all the elements on the input
   */

	}, {
		key: 'validateAll',
		value: function validateAll(validateChildren, state) {
			var _this = this;

			this.$options.vue.set(this, '$states', {});
			state = state || {};
			var inputValidation = [];
			for (var i = 0, len = this._inputElements.length; i < len; ++i) {
				inputValidation.push(this._inputElements[i].validate(state, true).then(noop, noop));
			}return this.$options.Promise.all(inputValidation).then(function () {
				if (validateChildren === false) return null;

				var childValidation = [];
				for (var _i = 0, _len = _this.$childValidators.length; _i < _len; ++_i) {
					childValidation.push(_this.$childValidators[_i].validateAll(true, state).then(noop, noop));
				}return Promise.all(childValidation);
			}).then(function () {
				if (state.errors) {
					var err = new Error();
					err.errors = state.errors;
					err.state = state;
					throw err;
				}
				return state;
			});
		}
		/**
   * Set the error for the validate
   */

	}, {
		key: 'setState',
		value: function setState(name, state) {
			var old = this.$states[name];
			this.$options.vue.set(this.$states, name, {
				dirty: old && old.dirty || state.dirty,
				errors: state.errors
			});
		}
		/**
   * Remark the field as pure
   */

	}, {
		key: 'setPristine',
		value: function setPristine(name) {
			var old = this.$states[name];
			if (old && old.dirty) {
				this.$options.vue.set(this.$states, name, {
					dirty: false,
					errors: old.errors
				});
			}
		}
		/**
   * Check for error
   */

	}, {
		key: 'hasError',
		value: function hasError(name) {
			var state = this.$states[name];
			if (state != null) {
				return state.dirty && state.errors;
			}
			for (var i = 0, len = this.$childValidators.length; i < len; ++i) {
				if (this.$childValidators[i].hasError(name)) return true;
			}return false;
		}
		/**
   * Destroy the validator
   */

	}, {
		key: '_destroy',
		value: function _destroy() {
			this.$childValidators = [];
			for (var i = 0, len = this.$parentValidator.$childValidators.length; i < len; ++i) {
				var item = this.$parentValidator.$childValidators[i];
				if (item === this) {
					this.$parentValidator.$childValidators.splice(i, 1);
					break;
				}
			}

			for (var _i2 = 0, _len2 = this._inputElements.length; _i2 < _len2; ++_i2) {
				var el = this._inputElements[_i2];
				el.unbind();
			}
			this._inputElements = [];
		}
	}]);
	return InputValidator;
}();


// Noop util
function noop() {}

var index = {
	install: function install(vue, options) {
		options = {
			vue: vue,
			Promise: options.Promise || Promise
		};
		vue.directive('validate', {
			bind: function bind(el, binding, vnode) {
				vnode.context.$inputValidator.bindElement(el, binding, vnode);
			},
			updated: function updated(el, binding, vnode) {
				vnode.context.$inputValidator.bindElement(el, binding, vnode);
			},
			unbind: function unbind(el, binding, vnode) {
				vnode.context.$inputValidator.unbindElement(el);
			}
		});

		// Create $inputValidator 
		vue.mixin({
			created: function created() {
				var v = null;
				if (!this.$parent) v = new InputValidator(this, null, options);else if (this.$options.validateScope) v = new InputValidator(this, this.$parent.$inputValidator, options);

				if (v != null) {
					vue.util.defineReactive(this, '$inputValidator', v);
					v.setup();
				} else vue.util.defineReactive(this, '$inputValidator', this.$parent.$inputValidator);
			},
			destroyed: function destroyed() {
				if (this.hasOwnProperty('$inputValidator')) {
					this.$inputValidator._destroy();
					delete this.$inputValidator;
				}
			}
		});
	},
	registerRule: function registerRule(name, rule) {
		Rules.register(name, rule);
	}
};

return index;

})));
