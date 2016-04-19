package com.dici.gitStats.data

import org.joda.time.DateTime
import org.joda.time.format.DateTimeFormat
import spray.json._

final case class Committer(name: String, email: String, html_url: String, avatar_url: String)
// TODO: eliminate this duplication without degrading the conciseness of the serialization code too much
final case class CommitInfo(message: String, date: DateTime)
final case class Commit(committer: Committer, message: String, date: DateTime)
final case class IngestedCommits(
    committers: List[Committer],
    commitsCount: List[(String, Int)],
    commitsTimelineByCommitter: Map[String, Map[String, List[CommitInfo]]],
    commitsPerHourOfDay: Map[String, Map[String, Int]],
    commitsPerDayOfWeek: Map[String, Map[String, Int]]
)

object GitStatsJsonProtocol extends DefaultJsonProtocol {
  val DATE_FORMAT = DateTimeFormat.forPattern("yyyy-MM-dd'T'HH:mm:ss'Z'")

  implicit val dateTimeFormat = new JsonFormat[DateTime] {
    override def write(dateTime: DateTime) = JsString(DATE_FORMAT.print(dateTime))
    override def read(value: JsValue)      = value match { case JsString(str) => DATE_FORMAT.parseDateTime(str) }
  }

  implicit val committerFormat       = jsonFormat4(Committer)
  implicit val commitInfoFormat      = jsonFormat2(CommitInfo)
  implicit val commitFormat          = jsonFormat3(Commit)
  implicit val ingestedCommitsFormat = jsonFormat5(IngestedCommits)
}
