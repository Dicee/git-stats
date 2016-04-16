package com.dici.gitStats.data.ingestors

import com.dici.collection.mutable.Counter
import com.dici.gitStats.data.{IngestedCommits, Commit, Committer}
import org.joda.time.DateTime
import org.joda.time.format.DateTimeFormat
import scala.collection.mutable.{ HashMap => MHashMap, ListBuffer }
import com.dici.gitStats._

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
                                        commits.toList.groupBy(commit => commit.committer.name + "," + CommitsIngestor.roundToDay(commit.date)),
                                        commitsPerHourOfDay,
                                        commitsPerDayOfWeek)

  private lazy val commitsPerHourOfDay = commitsClassifiedPerCommitterAndTimeRange(date => date.getHourOfDay, "%02d:00".format(_))

  private lazy val commitsPerDayOfWeek = {
    val daysOfWeek = Array("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
    commitsClassifiedPerCommitterAndTimeRange(date => date.getDayOfWeek - 1, daysOfWeek)
  }

  private def commitsClassifiedPerCommitterAndTimeRange(dateToRange: DateTime => Int, rangeToLabel: Int => String) =
    commits.groupBy(commit => dateToRange(commit.date)).mapValues(_.groupBy(_.committer.name).mapValues(_.size)).mapKeys(rangeToLabel)

}

object CommitsIngestor {
  private val ROUND_TO_DAY_FORMAT    = DateTimeFormat.forPattern("yyyy-MM-dd")
  def roundToDay(dateTime: DateTime): String = ROUND_TO_DAY_FORMAT.print(dateTime)
}