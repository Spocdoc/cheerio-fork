/*
  Module Dependencies
*/
var htmlparser = require('htmlparser2-fork'),
    _ = require('underscore'),
    isTag = require('./utils').isTag;
    camelCase = require('./utils').camelCase;

/*
  Parser
*/
exports = module.exports = function(content, options) {
  var dom = evaluate(content, options);

  // Generic root element
  var root = {
    type: 'root',
    nodeName: 'root',
    parentNode: null,
    previousSibling: null,
    nextSibling: null,
    childNodes: []
  };

  // Update the dom using the root
  update(dom, root);

  return root;
};

var evaluate = exports.evaluate = function(content, options) {
  // options = options || $.fn.options;

  var handler = new htmlparser.DomHandler(options),
      parser = new htmlparser.Parser(handler, options);

  parser.write(content);
  parser.done();

  return connect(handler.dom);
};

var connect = exports.connect = function(dom, parent) {
  parent = parent || null;

  var prevElem = null;

  _.each(dom, function(elem) {

    if (isTag(elem.type)) {
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
    else if (isTag(elem.type))
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
var update = exports.update = function(arr, parent) {
  // normalize
  if (!Array.isArray(arr)) arr = [arr];

  // Update neighbors
  for (var i = 0; i < arr.length; i++) {
    arr[i].previousSibling = arr[i - 1] || null;
    arr[i].nextSibling = arr[i + 1] || null;
    arr[i].parentNode = parent || null;
  }

  // Update parent
  parent.childNodes = arr;

  return parent;
};

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
