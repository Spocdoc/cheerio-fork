var ElementType = require("domelementtype-fork");

var _ = require('underscore'),
    select = require('cheerio-select-fork'),
    utils = require('../utils');

var find = exports.find = function(selector) {
  return this.make(select(selector, [].slice.call(this.children())));
};

// Get the parent of each element in the current set of matched elements,
// optionally filtered by a selector.
var parent = exports.parent = function(selector) {
  var set = [];
  var $set;

  this.each(function(idx, elem) {
    var parentElem = elem.parentNode;
    if (set.indexOf(parentElem) < 0 && parentElem.nodeType !== ElementType.Document && parentElem.nodeType != ElementType.DocumentFragment) {
      set.push(parentElem);
    }
  });

  $set = this.make(set)

  if (arguments.length) {
    $set = $set.filter(selector);
  }

  return $set;
};

var parents = exports.parents = function(selector) {
  if (this[0] && this[0].parentNode) {
    return traverseParents(this, this[0].parentNode, selector, Infinity);
  }
  return this;
};

// For each element in the set, get the first element that matches the selector
// by testing the element itself and traversing up through its ancestors in the
// DOM tree.
var closest = exports.closest = function(selector) {
  var set = [];

  if (!selector) {
    return this.make(set);
  }

  this.each(function(idx, elem) {
    var closestElem = traverseParents(this, elem, selector, 1)[0];

    // Do not add duplicate elements to the set
    if (closestElem && set.indexOf(closestElem) < 0) {
      set.push(closestElem);
    }
  }.bind(this));

  return this.make(set);
};

var next = exports.next = function() {
  var elem = this[0];
  if (!elem) { return this; }
  while ((elem = elem.nextSibling)) if (elem.nodeType === ElementType.Tag) return this.make(elem);
  return this.make([]);
};

var nextAll = exports.nextAll = function(selector) {
  if (!this[0]) { return this; }
  var elems = [], elem = this[0];
  while ((elem = elem.nextSibling)) if (elem.nodeType === ElementType.Tag) elems.push(elem);
  return this.make(selector ? select(selector, elems) : elems);
};

var prev = exports.prev = function() {
  if (!this[0]) { return this; }
  var elem = this[0];
  while ((elem = elem.previousSibling)) if (elem.nodeType === ElementType.Tag) return this.make(elem);
  return this.make([]);
};

var prevAll = exports.prevAll = function(selector) {
  if (!this[0]) { return this; }
  var elems = [], elem = this[0];
  while ((elem = elem.previousSibling)) if (elem.nodeType === ElementType.Tag) elems.push(elem);
  return this.make(selector ? select(selector, elems) : elems);
};

var siblings = exports.siblings = function(selector) {
  var elems = _.filter(
    this.parent() ? this.parent().children() : this.siblingsAndMe(),
    function(elem) { return elem.nodeType === ElementType.Tag && !this.is(elem); },
    this
  );
  if (selector !== undefined) {
    elems = this.make(select(selector, elems));
  }
  return this.make(elems);
};

var children = exports.children = function(selector) {

  var elems = _.reduce(this, function(memo, elem) {
    return memo.concat(_.filter(elem.childNodes, function (el) { return el.nodeType === ElementType.Tag; }));
  }, []);

  if (selector === undefined) return this.make(elems);
  else if (_.isNumber(selector)) return this.make(elems[selector]);

  return this.make(elems).filter(selector);
};

var contents = exports.contents = function() {
  return this.make(_.reduce(this, function(all, elem) {
    all.push.apply(all, elem.childNodes);
    return all;
  }, []));
}

var each = exports.each = function(fn) {
  var i = 0, len = this.length;
  while (i < len && fn.call(this.make(this[i]), i, this[i]) !== false) ++i;
  return this;
};

var map = exports.map = function(fn) {
  return _.map(this, function(el, i) {
    return fn.call(this.make(el), i, el);
  }, this);
};

var filter = exports.filter = function(match) {
  var make = _.bind(this.make, this);
  var filterFn;

  if (_.isString(match)) {
    filterFn = function(el) {
      return select(match, el)[0] === el;
    };
  } else if (_.isFunction(match)) {
    filterFn = function(el, i) {
      return match.call(make(el), i, el);
    };
  } else if (match.cheerio) {
    filterFn = match.is.bind(match);
  } else {
    filterFn = function(el) {
      return match === el;
    };
  }

  return make(_.filter(this, filterFn));
};

var first = exports.first = function() {
  return this[0] ? this.make(this[0]) : this;
};

var last = exports.last = function() {
  return this[0] ? this.make(this[this.length - 1]) : this;
};

// Reduce the set of matched elements to the one at the specified index.
var eq = exports.eq = function(i) {
  i = +i;
  if (i < 0) i = this.length + i;
  return this[i] ? this.make(this[i]) : this.make([]);
};

var slice = exports.slice = function() {
  return this.make([].slice.apply(this, arguments));
};

function traverseParents(self, elem, selector, limit) {
  var elems = [];
  while (elems.length < limit && elem.nodeType !== ElementType.Document && elem.nodeType !== ElementType.DocumentFragment) {
    if (!selector || self.make(elem).filter(selector).length) {
      elems.push(elem);
    }
    elem = elem.parentNode;
  }
  return self.make(elems);
}
