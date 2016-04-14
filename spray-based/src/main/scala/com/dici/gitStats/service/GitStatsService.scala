package com.dici.gitStats.service

import akka.actor.Actor
import akka.io.IO
import akka.pattern.ask
import com.dici.gitStats.Boot._
import com.dici.gitStats.Boot.system.dispatcher
import com.dici.gitStats._
import com.dici.gitStats.data.GitStatsJsonProtocol._
import com.dici.gitStats.data.{Commit, Committer}
import spray.can.Http
import spray.http.HttpResponse
import spray.httpx.RequestBuilding._
import spray.json._
import spray.routing._

import scala.concurrent.Future

class GitStatsServiceActor extends Actor with GitStatsService {
  def actorRefFactory = context
  implicit val system = context.system
  def receive         = runRoute(route)

  protected override def getCommits(repo: String): Future[List[Commit]] = {
    gitApiCall("repos/" + repo + "/commits")
      .map(_.entity.asString.parseJson.asInstanceOf[JsArray])
      .map(jsonArray => jsonArray.elements.map(extractBestPossibleCommitInfo).toList)
      .fallbackTo(Future(Nil))
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

  private def gitApiCall(endPoint: String) = (IO(Http) ? Get("https://api.github.com/" + endPoint)).mapTo[HttpResponse]
}

trait GitStatsService extends HttpService {
  val ROOT  = "git-stats"
  val route =
  (path(ROOT / "[^/]+".r / "[^/]+".r / "commits") & get) { (owner, repo) =>
    complete {
      getCommits(owner + "/" + repo).map(commits => DefaultJsonProtocol.listFormat[Commit].write(commits).prettyPrint)
    }
  }

  protected def getCommits(repo: String): Future[List[Commit]]
}
