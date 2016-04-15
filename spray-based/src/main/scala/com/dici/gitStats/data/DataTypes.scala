package com.dici.gitStats.data

import spray.json.DefaultJsonProtocol

final case class Committer(name: String, email: String, html_url: String, avatar_url: String)
final case class Commit(committer: Committer, message: String, date: String)
final case class IngestedCommits(
    committers: List[Committer],
    commits: List[Commit],
    commitsCount: List[(String, Int)],
    commitsByCommitterAndDate: Map[String, List[Commit]]
)

object GitStatsJsonProtocol extends DefaultJsonProtocol {
  implicit val committerFormat       = jsonFormat4(Committer)
  implicit val commitFormat          = jsonFormat3(Commit)
  implicit val ingestedCommitsFormat = jsonFormat4(IngestedCommits)
}
