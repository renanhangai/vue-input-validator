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
		key: '$set',
		value: function $set(name, error, tag) {
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
			if (typeof error === 'string') return error;
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
		if (options.vue) options.vue.util.defineReactive(this, 'errors', new ErrorBag(options));else this.errors = new ErrorBag(options);
	}
	/**
  * Set a rule for a field on the validator
  */


	createClass(Validator, [{
		key: 'setRule',
		value: function setRule(name, rule) {
			this.rules[name] = {
				name: name,
				rule: rule
			};
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

			var result = rule.rule(value);
			if (result && result.then) {
				var id = {};
				status.validationID = id;
				status.status = result.then(function (r) {
					if (status.validationID !== id) return status.status;
					if (r === false) {
						_this.errors.$set(name, true, INPUT_TAG);
						status.status = 'error';
					} else {
						_this.errors.$clear(name, INPUT_TAG);
						status.value = value;
						status.status = 'success';
					}
					return status.status;
				}, function (err) {
					if (status.validationID !== id) return status.status;
					_this.errors.$set(name, err, INPUT_TAG);
					status.status = 'error';
					return status.status;
				});
				return status.status;
			} else if (result === false) {
				this.errors.$set(name, true, INPUT_TAG);
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
				var status = this.status[name] = this.status[name] || {};
				var r = this.setValue(name, status.value || '');
				if (r && r.then) promises.push(r);
			}
			return p.all(promises).then(function () {
				var errors = {};
				var values = {};
				var hasError = false;
				for (var _name in _this2.rules) {
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

var index = {
	install: function install(vue, options) {
		options = options || {};

		var name = options.directive || "validate";
		vue.directive(name, {
			bind: function bind(el, binding, vnode) {
				if (!vnode.context.$validatorOwn) throw new Error("Invalid validator context.\nDid you set validate: true on the root context component? " + vnode.context.name);

				var name = el.getAttribute("name");
				vnode.context.$validator.setRule(name, binding.value);
				if (!binding.modifiers.dirty && el.value) vnode.context.$validator.setValue(name, el.value);

				var evt = binding.arg || 'input';
				el.addEventListener(evt, function (ev) {
					vnode.context.$validator.setValue(name, ev.target.value);
				});
			}
		});

		// Set the validator
		Object.defineProperty(vue.prototype, '$validator', {
			get: function get() {
				if (this.$root === this || this.$options.validate) {
					var parentValidator = this.$parent ? this.$parent.$validator : null;
					var validator = new Validator(parentValidator, { vue: vue });
					Object.defineProperty(this, '$validator', {
						value: validator
					});
					Object.defineProperty(this, '$validatorOwn', {
						value: true
					});
					return validator;
				}
				return this.$parent.$validator;
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
