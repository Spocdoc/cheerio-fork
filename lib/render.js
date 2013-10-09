var ElementType = require("domelementtype-fork");

var _ = require('underscore');
var utils = require('./utils');

var decode = utils.decode;
var encode = utils.encode;

/*
  Boolean Attributes
*/
var rboolean = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i;

/*
  Format attributes
*/
var formatAttrs = function(attributes) {
  if (!attributes) return '';

  var output = [],
      value;

  // Loop through the attributes
  for (var key in attributes) {
    // Make sure it doesn't format data attributes.
    if (key.substr(0, 5) === 'data-') continue;
    value = attributes[key];
    if (!value && (rboolean.test(key) || key === '/')) {
      output.push(key);
    } else {
      output.push(key + '="' + encode(decode(value)) + '"');
    }
  }

  return output.join(' ');
};

/*
  Format data entries
 */
var formatData = function(data) {
  if (!data) return '';

  return Object.keys(data).map(function(key) {
    return 'data-' + key + '="' + data[key] + '"';
  }).join(' ');
};

/*
  Self-enclosing tags (stolen from node-htmlparser)
*/
var singleTag = {
  AREA: 1,
  BASE: 1,
  BASEFONT: 1,
  BR: 1,
  COL: 1,
  FRAME: 1,
  HR: 1,
  IMG: 1,
  INPUT: 1,
  ISINDEX: 1,
  LINK: 1,
  META: 1,
  PARAM: 1,
  EMBED: 1,
  INCLUDE: 1,
  'YIELD': 1
};

var render = module.exports = function(dom, opts) {
  if (!Array.isArray(dom) && !dom.cheerio) dom = [dom];
  opts = opts || {};

  var output = [],
      xmlMode = opts.xmlMode || false,
      ignoreWhitespace = opts.ignoreWhitespace || false;

  _.each(dom, function(elem) {
    var pushVal;

    if (elem.nodeType === ElementType.Tag)
      pushVal = renderTag(elem, xmlMode);
    else if (elem.nodeType === ElementType.Directive)
      pushVal = renderDirective(elem);
    else if (elem.nodeType === ElementType.Comment)
      pushVal = renderComment(elem);
    else
      pushVal = renderText(elem);

    // Push rendered DOM node
    output.push(pushVal);

    if (elem.childNodes)
      output.push(render(elem.childNodes, opts));

    if ((!singleTag[elem.nodeName] || xmlMode) && elem.nodeType === ElementType.Tag) {
      if (!isClosedTag(elem, xmlMode)) {
        output.push('</' + elem.nodeName + '>');
      }
    }
  });

  return output.join('');
};

var isClosedTag = function(elem, xmlMode){
  if (xmlMode) {
    return (!elem.childNodes || elem.childNodes.length === 0);
  } else {
    return singleTag[elem.nodeName];
  }
}

var renderTag = function(elem, xmlMode) {
  var tag = '<' + elem.nodeName;

  if (elem.attributes && _.size(elem.attributes)) {
    if (_.size(elem.data)) tag += ' ' + formatData(elem.data);
    tag += ' ' + formatAttrs(elem.attributes);
  }

  if (isClosedTag(elem, xmlMode)) {
    tag += ' /';
  }
  
  return tag + '>';
};

var renderDirective = function(elem) {
  return '<' + elem.data + '>';
};

var renderText = function(elem) {
  return elem.data;
};

var renderComment = function(elem) {
  return '<!--' + elem.data + '-->';
};

// module.exports = $.extend(exports);
