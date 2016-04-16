package com.dici.gitStats.data

import org.joda.time.DateTime
import org.joda.time.format.DateTimeFormat
import spray.json._


final case class Committer(name: String, email: String, html_url: String, avatar_url: String)
final case class Commit(committer: Committer, message: String, date: DateTime)
final case class IngestedCommits(
    committers: List[Committer],
    commits: List[Commit],
    commitsCount: List[(String, Int)],
    commitsByCommitterAndDate: Map[String, List[Commit]]
)

object GitStatsJsonProtocol extends DefaultJsonProtocol {
  val DATE_FORMAT = DateTimeFormat.forPattern("yyyy-MM-dd'T'HH:mm:ss'Z'")

  implicit val dateTimeFormat = new JsonFormat[DateTime] {
    override def write(dateTime: DateTime) = JsString(DATE_FORMAT.print(dateTime))
    override def read(value: JsValue)      = value match { case JsString(str) => DATE_FORMAT.parseDateTime(str) }
  }

  implicit val committerFormat       = jsonFormat4(Committer)
  implicit val commitFormat          = jsonFormat3(Commit)
  implicit val ingestedCommitsFormat = jsonFormat4(IngestedCommits)
}
