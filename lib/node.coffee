ElementType = require "domelementtype-fork"
{evaluate,update} = require './parse'
{encode,decode} = require('./utils')
$ = require './static'

module.exports = class Node
  insertBefore: (newChild, refChild) ->
    siblings = @childNodes
    return unless ~(index = siblings.indexOf refChild)
    newChild.parentNode?.removeChild newChild
    siblings.splice index, 0, newChild
    update this, index-1, index+1
    this

  appendChild: (newChild) ->
    newChild.parentNode?.removeChild newChild
    len = (@childNodes ||= []).push newChild
    update this, len-2
    this

  removeChild: (oldChild) ->
    siblings = @childNodes
    return unless ~(index = siblings.indexOf oldChild)
    siblings.splice index, 1
    oldChild.parentNode = oldChild.previousSibling = oldChild.nextSibling = null
    update this, index-1, index
    this

  replaceChild: (newChild, oldChild) ->
    siblings = @childNodes
    return unless ~(index = siblings.indexOf oldChild)
    siblings[index] = newChild
    oldChild.parentNode = oldChild.previousSibling = oldChild.nextSibling = null
    update this, index-1, index+1
    this

  hasChildNodes: -> !!@childNodes.length

  getAttribute: (attr) ->
    if (attributes = @attributes) and attributes.hasOwnProperty attr then attributes[attr] else null

Object.defineProperty Node.prototype, "innerHTML",
  get: -> if children = @childNodes then $.html children else null
  set: (str) ->
    @childNodes = if str.cheerio then str.toArray() else evaluate(str)
    update this
    this
  enumerable: true
  configurable: true

Object.defineProperty Node.prototype, "textContent",
  get: -> $.text [this]
  set: (value) ->
    if this.nodeType is ElementType.Text
      @nodeValue = value
    else
      @childNodes =
        data: encode(value),
        nodeType: ElementType.Text,
        parentNode: null,
        previousSibling: null,
        nextSibling: null,
        childNodes: []
      update this
    value
  enumerable: true
  configurable: true

Object.defineProperty Node.prototype, "nodeValue",
  get: -> if @nodeType is ElementType.Text then decode @data else null
  set: (value) ->
    @data = encode ''+value if @nodeType is ElementType.Text
    value
  enumerable: true
  configurable: true
