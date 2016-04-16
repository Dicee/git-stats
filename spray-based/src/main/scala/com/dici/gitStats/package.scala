package com.dici

import spray.json.{JsNull, JsString, JsValue}

package object gitStats {
  implicit class JsValueToJsObject(value: JsValue) {
    private val node = value.asJsObject

    def getAsJsObject      (key: String) = getOptionalJsObject(key).get
    def getOptionalJsObject(key: String) = getNonNullOptional (key).map(_.asJsObject)

    def getAsString      (key: String) = getOptionalString (key).get
    def getOptionalString(key: String) = getNonNullOptional(key).map { case JsString(s) => s }

    private def getNonNullOptional(key: String) = node.fields.get(key).filter(_ != JsNull)
  }

  // TODO: get rid of this duplication
  implicit class AugmentedMutableMap[K, V](map: scala.collection.mutable.HashMap[K, V]) {
    def mapKeys[KR](f: K => KR) = map.map { case (k, v) => (f(k), v) }.toMap
  }

  // TODO: get rid of this duplication
  implicit class AugmentedImmutableMap[K, V](map: Map[K, V]) {
    def mapKeys[KR](f: K => KR) = map.map { case (k, v) => (f(k), v) }.toMap
  }
}
