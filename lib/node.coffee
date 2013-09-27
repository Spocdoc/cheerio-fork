Node = require './node'
{evaluate,update} = require './parse'
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

Object.defineProperty Node.prototype, "innerHTML",
  get: -> if children = @childNodes then $.html children else null
  set: (str) ->
    @childNodes = if str.cheerio then str.toArray() else evaluate(str)
    update this
    this
  enumerable: true
  configurable: true



