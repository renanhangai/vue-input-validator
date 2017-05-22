(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.VueInputValidator = factory());
}(this, (function () { 'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};











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

var ErrorBag = function () {
	function ErrorBag(options) {
		classCallCheck(this, ErrorBag);

		this.$setup(options);
	}

	createClass(ErrorBag, [{
		key: '$setup',
		value: function $setup(options) {
			var $internal = Object.freeze({
				options: options || {},
				errors: {}
			});
			Object.defineProperty(this, '$internal', {
				writable: false,
				enumerable: false,
				configurable: false,
				value: $internal
			});
		}
	}, {
		key: '$clear',
		value: function $clear(name, tag) {
			var errors = this.$internal.errors[name];
			if (!errors || errors.length <= 0) return;

			var newErrors = [];
			if (tag) {
				for (var i = 0, len = errors.length; i < len; ++i) {
					var err = errors[i];
					if (tag !== err.tag) newErrors.push(err);
				}
			}
			this.$setRaw(name, newErrors);
		}
	}, {
		key: '$update',
		value: function $update(name) {
			var errors = this.$internal.errors[name];
			var errorView = void 0;
			if (!errors || errors.length <= 0) errorView = false;else {
				errorView = [];
				for (var i = 0, len = errors.length; i < len; ++i) {
					errorView.push(ErrorBag.errorAsString(errors[i]));
				}
				errorView.first = errorView[0];
			}
			if (this.$internal.options.vue) this.$internal.options.vue.set(this, name, errorView);else this[name] = errorView;
		}
	}, {
		key: '$add',
		value: function $add(name, error, tag) {
			var errors = this[name] || [];
			errors.push({ name: name, error: error, tag: tag });
			this.$setRaw(name, errors);
		}
	}, {
		key: '$setRaw',
		value: function $setRaw(name, errors) {
			if (errors) errors = [].concat(errors);
			this.$internal.errors[name] = errors;
			this.$update(name);
		}
	}, {
		key: '$any',
		value: function $any() {
			for (var key in this.$internal.errors) {
				var errors = this.$internal.errors[key];
				if (errors && errors.length > 0) return true;
			}
			return false;
		}
	}], [{
		key: 'errorAsString',
		value: function errorAsString(error) {
			if (!error) return "";else if (typeof error === 'string') return error;else if (typeof error.message === 'string') return error.message;
			return "Error";
		}
	}]);
	return ErrorBag;
}();

var INPUT_TAG = {};

var Validator = function () {
	/**
  * Construct
  */
	function Validator(parent, options) {
		classCallCheck(this, Validator);

		options = options || {};
		this.options = options;
		this.status = {};
		this.rules = {};
		if (options.vue) options.vue.util.defineReactive(this, 'errors', new ErrorBag(options));else this.errors = new ErrorBag(options);
	}
	/**
  * Set a rule for a field on the validator
  */


	createClass(Validator, [{
		key: 'setValidator',
		value: function setValidator(name, rule) {
			this.rules[name] = {
				name: name,
				rule: rule
			};
			this.errors.$setRaw(name, false);
		}
		/**
   * Set a rule for a field on the validator
   */

	}, {
		key: 'removeValidator',
		value: function removeValidator(name) {
			this.rules[name] = null;
		}
		/**
   * Set an error for a field
   */

	}, {
		key: 'setError',
		value: function setError(name, error, options) {
			var rule = this.rules[name];
			if (!rule) return;

			var status = this.status[name] = this.status[name] || {};
			status.validationID = null;
			status.status = 'error';
			if (options && options.clear === false) this.errors.$clear(name, INPUT_TAG);
			this.errors.$add(name, error, error && error.persistent ? null : INPUT_TAG);
		}
		/**
   * Set the value for a field
   */

	}, {
		key: 'setValue',
		value: function setValue(name, value) {
			var _this = this;

			var rule = this.rules[name];
			if (!rule) return false;

			var status = this.status[name] = this.status[name] || {};
			this.errors.$clear(name, INPUT_TAG);
			status.validationID = null;
			if (status.result && typeof status.result.cancel === 'function') status.result.cancel();

			var result = void 0;
			var error = false;
			try {
				result = rule.rule(value);
			} catch (e) {
				result = false;
				error = e;
			}
			status.result = result;
			if (result && result.then) {
				var id = {};
				status.validationID = id;
				status.status = result.then(function (r) {
					if (status.validationID !== id) return null;
					if (r === false) {
						_this.errors.$add(name, true, INPUT_TAG);
						status.status = 'error';
					} else {
						_this.errors.$clear(name, INPUT_TAG);
						status.value = value;
						status.status = 'success';
					}
					return status.status;
				}, function (err) {
					if (status.validationID !== id) return null;
					_this.errors.$add(name, err, INPUT_TAG);
					status.status = 'error';
					return status.status;
				});
				return status.status;
			} else if (result === false) {
				this.errors.$add(name, error || true, INPUT_TAG);
				status.status = 'error';
				return status.status;
			} else {
				this.errors.$clear(name, INPUT_TAG);
				status.value = value;
				status.status = 'success';
				return status.status;
			}
		}
		/**
   * Validate the current validator
   */

	}, {
		key: 'validate',
		value: function validate() {
			var _this2 = this;

			var p = this.options.Promise || Promise;
			var promises = [];
			for (var name in this.rules) {
				var rule = this.rules[name];
				if (!rule) continue;
				var status = this.status[name] = this.status[name] || {};
				var r = this.setValue(name, status.value || '');
				if (r && r.then) promises.push(r);
			}
			return p.all(promises).then(function () {
				var errors = {};
				var values = {};
				var hasError = false;
				for (var _name in _this2.rules) {
					var _rule = _this2.rules[_name];
					if (!_rule) continue;

					var field = _this2.status[_name] = _this2.status[_name] || {};
					if (field.status !== 'success') {
						errors[_name] = _this2.errors[_name];
						hasError = true;
					} else {
						values[_name] = field.value;
					}
				}
				if (hasError) return p.reject(errors);
				return values;
			});
		}
	}]);
	return Validator;
}();


Object.defineProperty(Validator, 'INPUT_TAG', {
	writable: false,
	configurable: false,
	value: INPUT_TAG
});

/**
 *
 */
var RuleSet = function () {
	function RuleSet() {
		classCallCheck(this, RuleSet);

		this.rules = {};
	}

	createClass(RuleSet, [{
		key: 'register',
		value: function register(name, rule) {
			this.rules[name] = {
				name: name,
				rule: rule
			};
		}
	}, {
		key: 'getCallback',
		value: function getCallback(name) {
			var r = this.rules[name];
			if (!r) throw new Error('Invalid rule "' + name + '"');
			return r.rule;
		}
	}, {
		key: 'parse',
		value: function parse(rule) {
			var callbacks = this.parseInternal(rule);
			return this.makeCallbackChain(callbacks);
		}
	}, {
		key: 'parseInternal',
		value: function parseInternal(rule) {
			var callbacks = [];
			if (typeof rule === 'string') callbacks = callbacks.concat(this.parseInternalString(rule));else if (Array.isArray(rule)) {
				for (var i = 0, len = rule.length; i < len; ++i) {
					callbacks = callbacks.concat(this.parseInternal(rule));
				}
			} else if (typeof rule === 'function') {
				callbacks.push({
					callback: rule
				});
			} else {
				throw new Error("Invalid rule to parse: " + rule);
			}
			return callbacks;
		}
	}, {
		key: 'parseInternalString',
		value: function parseInternalString(str) {
			var rules = str.split("|");
			var callbacks = [];
			for (var i = 0, len = rules.length; i < len; ++i) {
				var args = rules[i].split(":");
				var rule = args.shift();
				callbacks.push({
					args: args,
					callback: this.getCallback(rule)
				});
			}
			return callbacks;
		}
	}, {
		key: 'makeCallbackChain',
		value: function makeCallbackChain(callbacks) {
			if (!callbacks || callbacks.length <= 0) return false;
			var continuation = function continuation(value, data) {
				if (data.cancelled) return false;
				while (data.i < callbacks.length) {
					var c = callbacks[data.i];
					var args = c.args || [];
					var result = c.callback.apply(null, [value].concat(args));
					data.current = result;
					if (result === false) return false;else if (result && result.then) {
						return result.then(function () {
							data.i += 1;
							return continuation(value, data);
						});
					}
					++data.i;
				}
				return true;
			};
			continuation.cancel = function (data) {
				if (!data.cancelled) {
					data.cancelled = true;
					if (data.current && typeof data.current.cancel === 'function') data.current.cancel();
				}
			};
			return function (v) {
				var data = { cancelled: false, i: 0 };
				var r = continuation(v, data);
				if ((typeof r === 'undefined' ? 'undefined' : _typeof(r)) === 'object') {
					r.cancel = function () {
						continuation.cancel(data);
					};
				}
				return r;
			};
		}
	}]);
	return RuleSet;
}();

var ruleset = new RuleSet();

var index = {
	registerRule: function registerRule(name, rule) {
		ruleset.register(name, rule);
	},
	install: function install(vue, options) {
		options = options || {};

		var name = options.directive || "validate";
		vue.directive(name, {
			bind: function bind(el, binding, vnode) {
				var validator = vnode.context.$validator;
				if (!vnode.context.$validatorOwn) throw new Error('Invalid validator context.\nDid you set validate: true on the root context component? ' + vnode.context.name);

				var isNative = binding.modifiers.native || !vnode.componentInstance;

				var name = getValidatorName(el, binding, vnode, isNative);
				if (!name) throw new Error('Missing attribute name on validator');
				validator.setValidator(name, ruleset.parse(binding.value));

				var evt = binding.arg || 'input';
				if (isNative) {
					if (!binding.modifiers.dirty && el.value) validator.setValue(name, el.value);
					el.addEventListener(evt, function (ev) {
						validator.setValue(name, getEventValue(ev));
					});
				} else {
					vnode.componentInstance.$on(evt, function (ev) {
						validator.setValue(name, getEventValue(ev));
					});
				}
			}
		});

		// Get the name for the validator
		function getValidatorName(el, binding, vnode, isNative) {
			if (!isNative) {
				var instance = vnode.componentInstance;
				if (instance && instance.$props && instance.$props.name) return instance.$props.name;
			}
			return el.getAttribute("name");
		}

		function getEventValue(ev) {
			if (ev.target && ev.target.value != null) return ev.target.value;
			return ev;
		}

		// Set the validator
		Object.defineProperty(vue.prototype, '$validator', {
			get: function get() {
				if (this.$options.validate === true) {
					var parentValidator = this.$parent ? this.$parent.$validator : null;
					var validator = new Validator(parentValidator, { vue: vue, Promise: options.Promise });
					Object.defineProperty(this, '$validator', {
						value: validator
					});
					Object.defineProperty(this, '$validatorOwn', {
						value: true
					});
					return validator;
				} else if (this.$options.validate === 'inherit') {
					var _validator = this.$parent ? this.$parent.$validator : null;
					if (!_validator) throw new Error("Invalid parent validator to inherit");
					Object.defineProperty(this, '$validator', {
						value: _validator
					});
					Object.defineProperty(this, '$validatorOwn', {
						value: true
					});
					return _validator;
				}
				return this.$parent && this.$parent.$validator;
			}
		});

		// Invalid validator
		Object.defineProperty(vue.prototype, '$errors', {
			get: function get() {
				return this.$validator.errors;
			}
		});
	}
};

return index;

})));
