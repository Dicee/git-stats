package com.dici.gitStats.data.mappers

import com.dici.gitStats.data.{Committer, Commit}
import spray.http.HttpResponse
import spray.json._

import scala.concurrent.Future
import com.dici.gitStats._
import com.dici.gitStats.Boot.system.dispatcher

class RawCommitsMapper extends DataMapper[HttpResponse, List[Commit]] {
  override def apply(response: HttpResponse) = {
    val commitsJSON = response.entity.asString.parseJson.asInstanceOf[JsArray]
    commitsJSON.elements.map(extractBestPossibleCommitInfo).toList
  }

  private def extractBestPossibleCommitInfo(value: JsValue) = {
    try {
      val commitNode    = value.getAsJsObject("commit")
      val authorNode    = value.getOptionalJsObject("author").getOrElse(commitNode.getAsJsObject("author"))
      val committerNode = value.getAsJsObject("commit").getAsJsObject("committer")

      val name          = authorNode   .getOptionalString("login"     ).orElse(authorNode.getOptionalString("name")).getOrElse("Unrecognized")
      val email         = committerNode.getAsString      ("email"     )
      val htmlUrl       = authorNode   .getOptionalString("html_url"  ).getOrElse("")
      val avatarUrl     = authorNode   .getOptionalString("avatar_url").getOrElse("")

      Commit(Committer(name, email, htmlUrl, avatarUrl), commitNode.getAsString("message"), committerNode.getAsString("date"))
    } catch {
      case t: Throwable => println(value.prettyPrint); throw t
    }
  }

  override def >>:(response: Future[HttpResponse]) = super.>>:(response) fallbackTo Future(Nil)
}
