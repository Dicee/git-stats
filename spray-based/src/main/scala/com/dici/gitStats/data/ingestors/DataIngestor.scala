package com.dici.gitStats.data.ingestors

import scala.concurrent.Future
import com.dici.gitStats.Boot.system.dispatcher

trait DataIngestor[DATA, RESULT] {
  def ingest(data: DATA): Unit
  def result: RESULT

  final def process(data:        Iterable[DATA]) :        RESULT  = { data.foreach(+=); result }
  final def process(data: Future[Iterable[DATA]]): Future[RESULT] = data.map(process)

  // convenience methods. Other methods are kept for facilitating the discoverability
  final def += (data:                 DATA  ) = ingest (data)
  final def >>:(data:        Iterable[DATA] ) = process(data)
  final def >>:(data: Future[Iterable[DATA]]) = process(data)
}