/*
  Update the dom structure, for one changed layer

  * Much faster than reconnecting
*/
module.exports = function(parent) {
  arr = parent.childNodes;
  if (!arr) return;

  // Update neighbors
  for (var i = 0, iE = arr.length; i < iE; i++) {
    arr[i].previousSibling = arr[i - 1] || null;
    arr[i].nextSibling = arr[i + 1] || null;
    arr[i].parentNode = parent || null;
  }

  // Update parent
  parent.childNodes = arr;

  return parent;
};
