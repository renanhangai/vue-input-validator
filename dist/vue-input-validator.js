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
		value: function validate(value, rules, options) {
			return new options.Promise(function (resolve) {
				resolve(Rules._validate(value, rules, options));
			}).then(function (result) {
				if (result === false || result == null) throw new Error("Invalid value");else if (result === true) return value;
				return result;
			});
		}
	}, {
		key: "_validate",
		value: function _validate(value, rules, options) {
			if (Array.isArray(rules)) {
				return Rules._validateArray(value, rules, options, 0);
			} else if (typeof rules === 'string') {
				rules = rules.split("|");
				for (var i = 0, len = rules.length; i < len; ++i) {
					rules[i] = rules[i].trim();
				}if (rules.length > 1) return Rules._validateArray(value, rules, options, 0);

				var newRule = $registered[rules];
				if (newRule == null) throw new Error("Invalid rule \"" + rules + "\"");
				return Rules._validate(value, newRule, options);
			} else if (typeof rules === 'function') {
				return rules(value);
			}
			throw new Error("Invalid rule");
		}
	}, {
		key: "_validateArray",
		value: function _validateArray(value, rules, options, offset) {
			offset = offset | 0;
			return options.Promise.resolve(Rules._validate(value, rules[offset], options)).then(function (result) {
				if (result === false || result == null) throw new Error("Invalid value");else if (result === true) result = value;
				return Rules._validateArray(result, rules, options, offset + 1);
			});
		}
	}]);
	return Rules;
}();

/**
 * Input validators
 */

var InputElementValidator = function () {
	function InputElementValidator(element, parentValidator) {
		classCallCheck(this, InputElementValidator);

		this.$element = element;
		this.$parentValidator = parentValidator;
		this.$validation = null;

		this.$unbind = null;
		this.onInput = this.onInput.bind(this);
	}

	createClass(InputElementValidator, [{
		key: 'unbind',
		value: function unbind() {
			if (this.$unbind != null) {
				this.$unbind();
				this.$unbind = null;
			}
		}
	}, {
		key: 'bind',
		value: function bind(binding, vnode) {
			var _this = this;

			if (vnode.componentInstance) {
				if (this.$boundComponent === vnode.componentInstance) return;
				this.unbind();
				this.$boundComponent = vnode.componentInstance;
				vnode.componentInstance.$on('input', this.onInput);
				this.$unbind = function () {
					vnode.componentInstance.$off('input', _this.onInput);
				};
			} else {
				if (this.$boundComponent === this.$element) return;
				this.unbind();
				this.$boundComponent = this.$element;
				this.$element.addEventListener('input', this.onInput);
				this.$unbind = function () {
					_this.$element.removeEventListener('input', _this.onInput);
				};
			}
		}
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

			this.$name = name;
			this.$validation = binding.value;
			this.validate();
		}
	}, {
		key: 'onInput',
		value: function onInput() {
			this.validate();
		}
	}, {
		key: 'validate',
		value: function validate(state) {
			var _this2 = this;

			var value = this.$boundComponent && this.$boundComponent.value || this.$element.value;
			var name = this.$name;
			this.$parentValidator.setError(name, null);
			return Rules.validate(value, this.$validation, this.$parentValidator.$options).then(function (result) {
				state.data = state.data || {};
				state.data[name] = result;
			}, function (err) {
				_this2.$parentValidator.setError(name, err);
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

/**
 * InputValidator
 */

var InputValidator = function () {
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
		this.$errors = {};
	}

	createClass(InputValidator, [{
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
	}, {
		key: 'unbindElement',
		value: function unbindElement(element) {
			var elements = [];
			for (var i = 0, len = this._inputElements.length; i < len; ++i) {
				var item = this._inputElements[i];
				if (item.$element !== element) elements.push(element);else item.unbind();
			}
		}
	}, {
		key: 'validateAll',
		value: function validateAll(validateChildren, state) {
			var _this = this;

			this.$errors = {};
			state = state || {};
			var inputValidation = [];
			for (var i = 0, len = this._inputElements.length; i < len; ++i) {
				inputValidation.push(this._inputElements[i].validate(state).then(noop, noop));
			}return this.$options.Promise.all(inputValidation).then(function () {
				if (validateChildren === false) return null;

				var childValidation = [];
				for (var _i = 0, _len = _this.$childValidators.length; _i < _len; ++_i) {
					childValidation.push(_this.$childValidators[_i].validateAll(true, state).then(noop, noop));
				}return Promise.all(childValidation);
			}).then(function () {
				if (state.errors) {
					var err = new Error();
					err.state = state;
					throw err;
				}
				return state;
			});
		}
	}, {
		key: 'setError',
		value: function setError(name, error) {
			this.$errors[name] = error;
		}
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



function noop() {}

var index = {
	install: function install(vue, options) {
		options = {
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
				if (this.$options.validateScope) {
					Object.defineProperty(this, '$inputValidator', { value: new InputValidator(this, this.$inputValidator, options) });
				}
			},
			destroyed: function destroyed() {
				if (this.hasOwnProperty('$inputValidator')) {
					this.$inputValidator._destroy();
					delete this.$inputValidator;
				}
			}
		});

		// Input validator
		Object.defineProperty(vue.prototype, '$inputValidator', {
			configurable: true,
			get: function get() {
				if (this.$parent) return this.$parent.$inputValidator;

				var v = new InputValidator(this, null, options);
				Object.defineProperty(this, '$inputValidator', {
					value: v
				});
				return v;
			}
		});
	},
	registerRule: function registerRule(name, rule) {
		Rules.register(name, rule);
	}
};

return index;

})));
