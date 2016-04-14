package com.dici.gitStats.data.mappers

import scala.concurrent.Future
import com.dici.gitStats.Boot.system.dispatcher

trait DataMapper[DATA, RESULT] extends Function[DATA, RESULT] {
  def >>:(data:        DATA ) = apply(data)
  def >>:(data: Future[DATA]) = data.map(this)
}
