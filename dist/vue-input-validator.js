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
		key: '$remove',
		value: function $remove(name) {
			var errors = this.$internal.errors[name];
			if (errors != null) this.$internal.errors[name] = null;
			if (this[name] != null) this[name] = null;
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
					errorView.push(ErrorBag.errorAsString(errors[i].error));
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
		key: '$getRaw',
		value: function $getRaw(name) {
			return this.$internal.errors[name];
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
			return "";
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
		this.elementsStorage = new (options.WeakMap || WeakMap)();
		if (options.vue) options.vue.util.defineReactive(this, 'errors', new ErrorBag(options));else this.errors = new ErrorBag(options);
	}
	/**
  * Set the validator as not dirty
  */


	createClass(Validator, [{
		key: 'setPristine',
		value: function setPristine(set$$1) {
			if (set$$1 == null) {
				for (var key in this.status) {
					this.status[key].dirty = false;
				}
			} else {
				for (var i = 0, len = set$$1.length; i < len; ++i) {
					var name = set$$1[i];
					var status = this.status[name];
					if (status) status.dirty = false;
				}
			}
		}
		/**
   * Clear validator errors
   */

	}, {
		key: 'clear',
		value: function clear(set$$1) {
			if (set$$1 == null) {
				for (var key in this.status) {
					this.status[key] = {};
					this.errors.$clear(key, INPUT_TAG);
				}
			} else {
				for (var i = 0, len = set$$1.length; i < len; ++i) {
					var _key = set$$1[i];
					this.status[_key] = {};
					this.errors.$clear(_key, INPUT_TAG);
				}
			}
		}
		/**
   * Bind a validator
   */

	}, {
		key: 'bindElement',
		value: function bindElement(rule, el, binding, vnode) {
			var _this = this;

			var isNative = binding.modifiers.native || !vnode.componentInstance;

			var name = getValidatorName(el, binding, vnode, isNative);
			if (!name) throw new Error('Missing attribute name on validator');

			var evt = binding.arg || 'input';

			var cleanup = [];
			var data = {
				name: name,
				value: binding.value,
				native: isNative,
				event: evt,
				unbind: function unbind() {
					for (var i = 0, len = cleanup.length; i < len; ++i) {
						cleanup[i].call();
					}
				}
			};

			var comp = isNative ? el : vnode.componentInstance;
			if (evt !== 'input') {
				addEvent(cleanup, comp, 'input', function (ev) {
					_this.errors.$clear(name, INPUT_TAG);
				});
			}
			addEvent(cleanup, comp, evt, function (ev) {
				_this.setValue(name, getEventValue(ev), true);
			});
			var ruledata = this.rules[data.name] = {
				name: data.name,
				rule: rule,
				optional: !!binding.modifiers.optional,
				dirty: !!binding.modifiers.dirty
			};
			if (isNative) ruledata.getValue = function () {
				return el.value;
			};else ruledata.getValue = function () {
				return comp.value;
			};
			this.elementsStorage.set(el, data);
			var status = this.status[name] = {};
			if (ruledata.dirty) status.dirty = true;
		}
		/**
   * Update an element
   */

	}, {
		key: 'updateElement',
		value: function updateElement(rule, el, binding, vnode) {
			var data = this.elementsStorage.get(el);
			if (!data) {
				this.bindElement(rule, el, binding, vnode);
				return;
			}

			var name = getValidatorName(el, binding, vnode, data.native);
			if (data.name !== name || data.value !== binding.value) {
				var oldStatus = this.status[data.name];
				var oldErrors = this.errors.$getRaw(data.name);
				this.unbindElement(el);
				this.bindElement(rule, el, binding, vnode);
				this.status[name] = oldStatus;
				this.errors.$setRaw(name, oldErrors);
			}
		}
		/**
   * Unbind an element
   */

	}, {
		key: 'unbindElement',
		value: function unbindElement(el) {
			var data = this.elementsStorage.get(el);
			if (!data) return;
			var name = data.name;
			this.rules[name] = null;
			this.status[name] = null;
			this.errors.$remove(name);
			data.unbind();
			this.elementsStorage.delete(el);
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
		value: function setValue(name, value, keepDirty) {
			var _this2 = this;

			// No rule
			var rule = this.rules[name];
			if (!rule) return false;

			var status = this.status[name] = this.status[name] || {};
			if (!status.dirty && !value && keepDirty) return false;
			status.dirty = true;

			// Functions
			var setSuccess = function setSuccess(value) {
				_this2.errors.$clear(name, INPUT_TAG);
				status.value = value;
				status.status = 'success';
				status.result = null;
				return status.status;
			};
			var setError = function setError(err) {
				err = err || true;
				_this2.errors.$add(name, err, INPUT_TAG);
				status.error = err;
				status.status = 'error';
				status.result = null;
				return status.status;
			};

			this.errors.$clear(name, INPUT_TAG);
			status.validationID = null;
			if (status.result && typeof status.result.cancel === 'function') status.result.cancel();

			// Optional rule
			if (!value && rule.optional) return setSuccess('');

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
					return r === false ? setError() : setSuccess(value);
				}, function (err) {
					if (status.validationID !== id) return null;
					return setError(err);
				});
				return status.status;
			} else if (result === false) {
				return setError(error);
			} else {
				return setSuccess(value);
			}
		}
		/**
   * Validate the current fields
   */

	}, {
		key: 'validate',
		value: function validate(set$$1) {
			var _this3 = this;

			var p = this.options.Promise || Promise;
			var promises = [];
			if (set$$1 == null) {
				set$$1 = [];
				for (var name in this.rules) {
					if (!this.rules[name]) continue;
					set$$1.push(name);
				}
			}

			for (var i = 0, len = set$$1.length; i < len; ++i) {
				var _name = set$$1[i];
				var rule = this.rules[_name];
				if (!rule) throw new Error('Unknown field "' + _name + '"');
				var value = rule.getValue();
				var r = this.setValue(_name, value || '');
				if (r && r.then) promises.push(r);
			}
			return p.all(promises).then(function () {
				var errors = {};
				var values = {};
				var hasError = false;
				for (var _i = 0, _len = set$$1.length; _i < _len; ++_i) {
					var _name2 = set$$1[_i];
					var _rule = _this3.rules[_name2];
					if (!_rule) continue;

					var error = _this3.errors[_name2];
					var field = _this3.status[_name2] || {};
					if (error || field.status !== 'success') {
						errors[_name2] = error;
						hasError = true;
					} else {
						values[_name2] = field.value;
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

// Get the name for the validator
function getValidatorName(el, binding, vnode, isNative) {
	var instance = vnode.componentInstance;
	if (instance && instance.$props && instance.$props.name) return instance.$props.name;
	return el.getAttribute("name");
}

function getEventValue(ev) {
	if (ev.target && ev.target.value != null) return ev.target.value;
	return ev;
}

function addEvent(cleanup, obj, evt, cb) {
	var onOff = typeof obj.$on === 'function';
	if (onOff) {
		obj.$on(evt, cb);
		cleanup.push(function () {
			obj.$off(evt, cb);
		});
	} else {
		obj.addEventListener(evt, cb);
		cleanup.push(function () {
			obj.removeEventListener(evt, cb);
		});
	}
}

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
				var rule = ruleset.parse(binding.value);
				validator.bindElement(rule, el, binding, vnode);
			},
			update: function update(el, binding, vnode) {
				var validator = vnode.context.$validator;
				var rule = ruleset.parse(binding.value);
				validator.updateElement(rule, el, binding, vnode);
			},
			unbind: function unbind(el, binding, vnode) {
				var validator = vnode.context.$validator;
				validator.unbindElement(el, binding, vnode);
			}
		});

		// Set the validator
		Object.defineProperty(vue.prototype, '$validator', {
			get: function get() {
				var validator = null;
				if (this.$options.validate === true) {
					var parentValidator = this.$parent ? this.$parent.$validator : null;
					validator = new Validator(parentValidator, { vue: vue, Promise: options.Promise });
				} else if (this.$options.validate === 'inherit') {
					validator = this.$parent ? this.$parent.$validator : null;
					if (!validator) throw new Error("Invalid parent validator to inherit");
				}

				if (validator) {
					Object.defineProperty(this, '$validator', {
						value: validator
					});
					Object.defineProperty(this, '$validatorOwn', {
						value: true
					});
					return validator;
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
