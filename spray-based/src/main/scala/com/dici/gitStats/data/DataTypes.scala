package com.dici.gitStats.data

import java.net.URL

import spray.http.DateTime
import spray.json.DefaultJsonProtocol

final case class Committer(name: String, email: String, html_url: String, avatar_url: String)
final case class Commit(committer: Committer, message: String, date: String)

object GitStatsJsonProtocol extends DefaultJsonProtocol {
  implicit val committerFormat       = jsonFormat4(Committer)
  implicit val commitFormat          = jsonFormat3(Commit)
}
