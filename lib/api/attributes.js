var ElementType = require("domelementtype-fork");

var _ = require('underscore'),
    utils = require('../utils'),
    decode = utils.decode,
    encode = utils.encode,
    rspace = /\s+/,

    // Attributes that are booleans
    rboolean = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i;


var setAttr = function(el, name, value) {
  if (typeof name === 'object') return _.extend(el.attributes, name);

  if (value === null) {
    removeAttribute(el, name);
  } else {
    el.attributes[name] = encode(value);
  }

  return el.attributes;
};

var attr = exports.attr = function(name, value) {
  // Set the value (with attr map support)
  if (typeof name === 'object' || value !== undefined) {
    if (_.isFunction(value)) {
      return this.each(function(i, el) {
        setAttr(el, name, value.call(this, i, el.attributes[name]));
      });
    } 
    return this.each(function(i, el) {
      el.attributes = setAttr(el, name, value);
    });
  }

  var elem = this[0];

  if (!elem || elem.nodeType !== ElementType.Tag) return;

  if (!elem.attributes) {
    elem.attributes = {};
  }

  // Return the entire attributes object if no attribute specified
  if (!name) {
    for (var a in elem.attributes) {
      elem.attributes[a] = decode(elem.attributes[a]);
    }
    return elem.attributes;
  }

  if (Object.prototype.hasOwnProperty.call(elem.attributes, name)) {
    // Get the (decoded) attribute
    return decode(elem.attributes[name]);
  }
};

var prop = exports.prop = function (name, value) {
  if (!name || name.constructor !== String) {
    return attr.apply(this, arguments);
  }

  var elem = this[0];
  if (!elem || elem.nodeType !== ElementType.Tag) return;

  if (arguments.length < 2) {
    return elem.attributes && (name in elem.attributes);
  } else {
    if (value) {
      (elem.attributes || (elem.attributes = {}))[name] = 'true';
    } else if (elem.attributes) {
      delete elem.attributes[name];
    }
  }

};

var setData = function(el, name, value) {
  if (typeof name === 'object') return _.extend(el.data, name);
  if (typeof name === 'string' && value !== undefined) {
    el.data[name] = encode(value);
  } else if (typeof name === 'object') {
    // If its an object, loop through it
    _.each(name, function(value, key) {
      el.data[key] = encode(value);
    });
  }

  return el.data;
};

var data = exports.data = function(name, value) {
  var elem = this[0];

  if (!elem || elem.nodeType !== ElementType.Tag) return;

  if (!elem.data) {
    elem.data = {};
  }

  // Return the entire data object if no data specified
  if (!name) {

    _.each(elem.data, function(value, key) {
      elem.data[key] = decode(value);
    });

    return elem.data;
  }

  // Set the value (with attr map support)
  if (typeof name === 'object' || value !== undefined) {
    this.each(function(i, el) {
      el.data = setData(el, name, value);
    });
    return this;
  } else if (Object.hasOwnProperty.call(elem.data, name)) {
    // Get the (decoded) data
    return decode(elem.data[name]);
  } else if (typeof name === 'string' && value === undefined) {
    return undefined;
  }

  return this;
};

/**
 * Get the value of an element
 */

var val = exports.val = function(value) {
  var querying = arguments.length === 0,
      element = this[0];

  if(!element) return;

  switch (element.nodeName) {
    case 'TEXTAREA':
      return querying ? this.text() : this.each(function() {
        this.text(value);
      });
    case 'INPUT':
      switch (this.attr('type')) {
        case 'radio':
          var queryString = 'input[type=radio][name=' + this.attr('name') + ']';
          var parentEl, root;

          // Go up until we hit a form or root
          parentEl = this.closest('form');
          if (parentEl.length === 0) {
            root = (this.parents().last()[0] || this[0]).parentNode;
            parentEl = this.make(root);
          }

          parentEl = parentEl.find(queryString);

          if (querying) {
            return parentEl.filter(":checked").attr('value');
          } else {
            parentEl.filter(':checked').removeAttr('checked');
            parentEl.filter('[value="' + value + '"]').attr('checked', '');
            return this;
          }
          break;
        default:
          return querying ? this.attr('value') : this.each(function() {
            this.attr('value', value);
          });
    }
    case 'SELECT':
      var option = this.find('option:selected'),
          returnValue;
      if (option === undefined) return undefined;
      if (!querying) {
        if (!this.attr().hasOwnProperty('multiple') && typeof value == 'object') {
          return this;
        }
        if (typeof value != 'object') {
          value = [value];
        }
        this.find('option').removeAttr('selected');
        for (var i = 0; i < value.length; i++) {
          this.find('option[value="' + value[i] + '"]').attr('selected', '');
        }
        return this;
      }
      returnValue = option.attr('value');
      if (this.attr().hasOwnProperty('multiple')) {
        returnValue = [];
        option.each(function() {
          returnValue.push(this.attr('value'));
        });
      }
      return returnValue;
    case 'OPTION':
      if (!querying) {
          this.attr('value', value);
          return this;
      }
      return this.attr('value');
  }
};

/**
 * Remove an attribute
 */

var removeAttribute = function(elem, name) {
 if (elem.nodeType !== ElementType.Tag || !elem.attributes || !Object.hasOwnProperty.call(elem.attributes, name))
   return;

 if (rboolean.test(elem.attributes[name]))
   elem.attributes[name] = false;
 else
   delete elem.attributes[name];
};


var removeAttr = exports.removeAttr = function(name) {
  this.each(function(i, elem) {
    removeAttribute(elem, name);
  });

  return this;
};

var hasClass = exports.hasClass = function(className) {
  return _.any(this, function(elem) {
    var attrs = elem.attributes;
    return attrs && _.contains((attrs['class'] || '').split(rspace), className);
  });
};

var addClass = exports.addClass = function(value) {
  // Support functions
  if (_.isFunction(value)) {
    this.each(function(i) {
      var className = this.attr('class') || '';
      this.addClass(value.call(this, i, className));
    });
  }

  // Return if no value or not a string or function
  if (!value || !_.isString(value)) return this;

  var classNames = value.split(rspace),
      numElements = this.length,
      numClasses,
      setClass,
      $elem;


  for (var i = 0; i < numElements; i++) {
    $elem = this.make(this[i]);
    // If selected element isnt a tag, move on
    if (!this[i] || this[i].nodeType !== ElementType.Tag) continue;

    // If we don't already have classes
    if (!$elem.attr('class')) {
      $elem.attr('class', classNames.join(' ').trim());
    } else {
      setClass = ' ' + $elem.attr('class') + ' ';
      numClasses = classNames.length;

      // Check if class already exists
      for (var j = 0; j < numClasses; j++) {
        if (!~setClass.indexOf(' ' + classNames[j] + ' '))
          setClass += classNames[j] + ' ';
      }

      $elem.attr('class', setClass.trim());
    }
  }

  return this;
};

var removeClass = exports.removeClass = function(value) {
  var split = function(className) {
    return className ? className.trim().split(rspace) : [];
  };

  var classes = split(value);

  // Handle if value is a function
  if (_.isFunction(value)) {
    return this.each(function(i, el) {
      this.removeClass(value.call(this, i, el.attributes['class'] || ''));
    });
  }

  return this.each(function(i, el) {
    if (!el || el.nodeType !== ElementType.Tag) return;
    el.attributes['class'] = (!value) ? '' : _.reject(
      split(el.attributes['class']),
      function(name) { return _.contains(classes, name); }
    ).join(' ');
  });
};

var is = exports.is = function (selector) {
  if (selector) {
    return this.filter(selector).length > 0;
  }
  return false;
}

