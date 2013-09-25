var ElementType = require("domelementtype-fork");

var parseDOM = require('htmlparser2-fork').parseDOM,
    _ = require('underscore'),
    camelCase = require('./utils').camelCase,
    Node = require('./node');

/*
  Parser
*/
exports = module.exports = function(content, options) {
  var dom = evaluate(content, options);

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
  options.Node = Node;
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

var update = exports.update = require('./update_dom');

/**
 * Extract data by using element attributes.
 * @param  {Object} elem Element
 * @return {Object}      `element.data` object
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
