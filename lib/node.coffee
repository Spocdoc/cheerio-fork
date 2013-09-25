updateDOM = require './update_dom'

module.exports = class Node
  insertBefore: (newChild, refChild) ->
    siblings = @childNodes
    return unless ~(index = siblings.indexOf refChild)
    newChild.parentNode?.removeChild newChild
    siblings.splice index, 0, newChild
    updateDOM this
    this

  appendChild: (newChild) ->
    newChild.parentNode?.removeChild newChild
    (@childNodes ||= []).push newChild
    updateDOM this
    this

  removeChild: (oldChild) ->
    siblings = @childNodes
    return unless ~(index = siblings.indexOf oldChild)
    siblings.splice index, 1
    oldChild.parentNode = oldChild.previousSibling = oldChild.nextSibling = null
    updateDOM this
    this

  replaceChild: (newChild, oldChild) ->
    siblings = @childNodes
    return unless ~(index = siblings.indexOf oldChild)
    siblings[index] = newChild
    oldChild.parentNode = oldChild.previousSibling = oldChild.nextSibling = null
    updateDOM this
    this

  hasChildNodes: -> !!@childNodes.length
