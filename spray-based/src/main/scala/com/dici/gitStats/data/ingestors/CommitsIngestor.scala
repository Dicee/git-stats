package com.dici.gitStats.data.ingestors

import java.text.SimpleDateFormat

import com.dici.collection.mutable.Counter
import com.dici.gitStats.data.{IngestedCommits, Commit, Committer}
import scala.collection.mutable.{ HashMap => MHashMap, ListBuffer }

class CommitsIngestor extends DataIngestor[Commit, IngestedCommits] {
  private val committersDedupedByProfileAndName = MHashMap[(String, String), Committer]()
  private val commits                           = ListBuffer[Commit]()
  private val commitsCount                      = new Counter[String]()

  override def ingest(commit: Commit) = {
    val committer = commit.committer
    committersDedupedByProfileAndName += (committer.html_url, committer.name) -> committer
    commits                           += commit
    commitsCount                      += committer.name
  }

  override def result = IngestedCommits(committersDedupedByProfileAndName.values.toList,
                                        commits.toList,
                                        commitsCount.toMap.toArray.sortBy(- _._2).toList,
                                        commits.toList.groupBy(commit => commit.committer.name + "," + CommitsIngestor.roundToDay(commit.date)))
}

object CommitsIngestor {
  private val DATE_FORMAT  = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'")
  private val ROUND_TO_DAY = new SimpleDateFormat("yyyy-MM-dd")

  def roundToDay(dateString: String): String = ROUND_TO_DAY.format(DATE_FORMAT.parse(dateString))
}