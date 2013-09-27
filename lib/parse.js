var ElementType = require("domelementtype-fork");

var parseDOM = require('htmlparser2-fork').parseDOM,
    _ = require('underscore'),
    camelCase = require('./utils').camelCase,
    Node = null;

/*
  Parser
*/
exports = module.exports = function(content, options) {
  var dom = evaluate(content, options);
  Node || (Node = require('./node'));

  // Generic root element
  var root = {
    __proto__: Node.prototype,
    nodeType: ElementType.DocumentFragment,
    nodeName: '#document-fragment',
    parentNode: null,
    previousSibling: null,
    nextSibling: null,
    childNodes: dom
  };

  // Update the dom using the root
  update(root);

  return root;
};

var evaluate = exports.evaluate = function(content, options) {
  // options = options || $.fn.options;
  options = options || {};
  options.Node = Node || (Node = require('./node'));
  return connect(parseDOM(content, options));
};

var connect = exports.connect = function(dom, parent) {
  parent = parent || null;

  var prevElem = null;

  _.each(dom, function(elem) {

    if (elem.nodeType === ElementType.Tag) {
      // If tag and no attributes, add empty object
      if (elem.attributes === undefined) {
        elem.attributes = {};
      } else {
        // If there are already attributes, add them to the data list.
        elem.data = parseData(elem);
      }
    }

    // Set parent
    elem.parentNode = parent;

    // Previous Sibling
    elem.previousSibling = prevElem;

    // Next sibling
    elem.nextSibling = null;
    if (prevElem) prevElem.nextSibling = elem;

    // Run through the childNodes
    if (elem.childNodes)
      connect(elem.childNodes, elem);
    else if (elem.nodeType === ElementType.Tag)
      elem.childNodes = [];

    // Get ready for next element
    prevElem = elem;
  });

  return dom;
};

/*
  Update the dom structure, for one changed layer

  * Much faster than reconnecting
*/
var update = exports.update = function(parent, from, to) {
  arr = parent.childNodes;
  if (!arr) return;

  from = Math.max(0,from || 0);
  to = Math.min(arr.length,to == null ? Infinity : to);

  // Update neighbors
  for (;from < to; from++) {
    arr[from].previousSibling = arr[from - 1] || null;
    arr[from].nextSibling = arr[from + 1] || null;
    arr[from].parentNode = parent || null;
  }

  // Update parent
  parent.childNodes = arr;

  return parent;
};

/**
 * Extract data by using element attributes.
 * @param  {Object} elem Element
 * @return {Object}      element.data object
 */
var parseData = exports.parseData = function(elem) {
  if (elem.data === undefined) elem.data = {};
  var value;
  for (var key in elem.attributes) {
    if (key.substr(0, 5) === 'data-') {
      value = elem.attributes[key];
      key = key.slice(5);
      key = camelCase(key);
      elem.data[key] = value;
    }
  }
  return elem.data;
};

// module.exports = $.extend(exports);
