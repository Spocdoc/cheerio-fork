var ElementType = require("domelementtype-fork");

var _ = require('underscore'),
    parse = require('../parse'),
    $ = require('../static'),
    updateDOM = parse.update,
    evaluate = parse.evaluate,
    encode = require('../utils').encode,
    slice = Array.prototype.slice;

/*
  Creates an array of cheerio objects,
  parsing strings if necessary
*/
var makeCheerioArray = function(elems) {
  return _.chain(elems).map(function(elem) {
    if (elem.cheerio) {
      return elem.toArray();
    } else if (!Array.isArray(elem)) {
      return evaluate(elem);
    } else {
      return elem;
    }
  }).flatten().value();
};

var _insert = function(concatenator) {
  return function() {
    var elems = slice.call(arguments),
        dom = makeCheerioArray(elems);

    return this.each(function(i, el) {
      if (_.isFunction(elems[0])) return el; // not yet supported
      concatenator(dom, (el.childNodes || el.childNodes = []));
      updateDOM(el);
    });
  };
};

var append = exports.append = _insert(function(dom, childNodes) {
  Array.prototype.push.apply(childNodes, dom);
});

var prepend = exports.prepend = _insert(function(dom, childNodes) {
  Array.prototype.unshift.apply(childNodes, dom);
});

var after = exports.after = function() {
  var elems = slice.call(arguments),
      dom = makeCheerioArray(elems),
      domLen = dom.length;

  this.each(function(i, el) {
    var parent = el.parentNode,
        siblings = parent.childNodes,
        index = siblings.indexOf(el);

    // If not found, move on
    if (!~index) return;

    // Add element after `this` element
    siblings.splice.apply(siblings, [++index, 0].concat(dom));

    // Update next, prev, and parent pointers
    updateDOM(parent);

  });

  return this;
};

var before = exports.before = function() {
  var elems = slice.call(arguments),
      dom = makeCheerioArray(elems);

  this.each(function(i, el) {
    var parent = el.parentNode,
        siblings = parent.childNodes,
        index = siblings.indexOf(el);

    // If not found, move on
    if (!~index) return;

    // Add element before `el` element
    siblings.splice.apply(siblings, [index, 0].concat(dom));

    // Update next, prev, and parent pointers
    updateDOM(parent);

  });

  return this;
};

/*
  remove([selector])
*/
var remove = exports.remove = function(selector) {
  var elems = this;

  // Filter if we have selector
  if (selector)
    elems = elems.filter(selector);

  elems.each(function(i, el) {
    var parent = el.parentNode,
        siblings = parent.childNodes,
        index = siblings.indexOf(el);

    if (!~index) return;

    siblings.splice(index, 1);

    // Update next, prev, and parent pointers
    updateDOM(parent);
    el.parentNode = el.nextSibling = el.previousSibling = null;
  });

  return this;
};

var replaceWith = exports.replaceWith = function(content) {
  content = makeCheerioArray([content]);

  this.each(function(i, el) {
    var parent = el.parentNode,
        siblings = parent.childNodes,
        index = siblings.indexOf(el);

    if (!~index) return;

    siblings.splice.apply(siblings, [index, 1].concat(content));

    updateDOM(parent);
    el.parentNode = el.nextSibling = el.previousSibling = null;
  });

  return this;
};

var empty = exports.empty = function() {
  this.each(function(i, el) {
    el.childNodes = [];
  });
  return this;
};

/**
 * Set/Get the HTML
 */
var html = exports.html = function(str) {
  if (str === undefined) {
    if (!this[0] || !this[0].childNodes) return null;
    return $.html(this[0].childNodes);
  }

  str = str.cheerio ? str.toArray() : evaluate(str);

  this.each(function(i, el) {
    el.childNodes = str;
    updateDOM(el);
  });

  return this;
};

var toString = exports.toString = function() {
  return $.html(this);
};

var text = exports.text = function(str) {
  // If `str` is undefined, act as a "getter"
  if (str === undefined) {
    return $.text(this);
  } else if (_.isFunction(str)) {
    // Function support
    return this.each(function(i, el) {
      return this.text(str.call(el, i, this.text()));
    });
  }

  var elem = {
    data: encode(str),
    nodeType: ElementType.Text,
    parentNode: null,
    previousSibling: null,
    nextSibling: null,
    childNodes: []
  };

  // Append text node to each selected elements
  this.each(function(i, el) {
    el.childNodes = elem;
    updateDOM(el);
  });

  return this;
};

var clone = exports.clone = function() {
  // Turn it into HTML, then recreate it,
  // Seems to be the easiest way to reconnect everything correctly
  return this.constructor($.html(this));
};
