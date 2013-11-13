var ElementType = require("domelementtype-fork");

var select = require('cheerio-select-fork'),
    parse = require('./parse'),
    render = require('./render'),
    decode = require('./utils').decode;

/**
 * $.load(str)
 */

var load = exports.load = function(str, options) {
  var Cheerio = require('./cheerio'),
      root = parse(str, options);

  var initialize = function(selector, context, r) {
    return new Cheerio(selector, context, r || root);
  };

  // Add in the static methods
  initialize.__proto__ = exports;

  // Add in the root
  initialize._root = root;

  return initialize;
};

/**
 * $.html([selector | dom])
 */

var html = exports.html = function(dom) {
  if (dom) {
    dom = (typeof dom === 'string') ? select(dom, this._root) : dom;
    return render(dom);
  } else if (this._root && this._root.childNodes) {
    return render(this._root.childNodes);
  } else {
    return '';
  }
};

/**
 * $.xml([selector | dom])
 */

var xml = exports.xml = function(dom) {
  if (dom) {
    dom = (typeof dom === 'string') ? select(dom, this._root) : dom;
    return render(dom, { xmlMode: true });
  } else if (this._root && this._root.childNodes) {
    return render(this._root.childNodes, { xmlMode: true });
  } else {
    return '';
  }
};

/**
 * $.text(dom)
 */

var text = exports.text = function(elems) {
  if (!elems) return '';

  var ret = '',
      len = elems.length,
      elem;

  for (var i = 0; i < len; i ++) {
    elem = elems[i];
    if (elem.nodeType === ElementType.Text) ret += decode(elem.data);
    else if (elem.childNodes && elem.nodeType !== ElementType.Comment) {
      ret += text(elem.childNodes);
    }
  }

  return ret;
};

/**
 * $.parseHTML(data [, context ] [, keepScripts ])
 * Parses a string into an array of DOM nodes. The `context` argument has no
 * meaning for Cheerio, but it is maintained for API compatability with jQuery.
 */
var parseHTML = exports.parseHTML = function(data, context, keepScripts) {
  var parsed;

  if (!data || typeof data !== 'string') {
    return null;
  }

  if (typeof context === 'boolean') {
    keepScripts = context;
  }

  parsed = this.load(data);
  if (!keepScripts) {
    parsed('script').remove();
  }

  // orphan all the nodes so remove won't remove from array
  var children = parsed.root()[0].childNodes;
  for (var i = 0, iE = children.length; i < iE; ++i) {
    children[i].parentNode = null;
  }

  return children;
};

/**
 * $.root()
 */
var root = exports.root = function() {
  return this(this._root);
};

/**
 * $.contains()
 */
var contains = exports.contains = function(container, contained) {

  // According to the jQuery API, an element does not "contain" itself
  if (contained === container) {
    return false;
  }

  // Step up the descendents, stopping when the root element is reached
  // (signaled by `.parentNode` returning a reference to the same object)
  while (contained && contained !== contained.parentNode) {
    contained = contained.parentNode;
    if (contained === container) {
      return true;
    }
  }

  return false;
};

exports.textNode = parse.textNode;

