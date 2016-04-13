package com.dici.gitStats.service

import akka.actor.Actor
import akka.io.IO
import com.dici.gitStats.data.{Commit, GitStatsJsonProtocol, Committer}
import spray.can.Http
import spray.http.HttpResponse
import spray.http.MediaTypes._
import spray.routing._
import spray.httpx.SprayJsonSupport._

import spray.httpx.RequestBuilding._
import akka.pattern.ask
import scala.concurrent.Future
import scala.util.Success
import com.dici.gitStats.Boot._
import system.dispatcher
import spray.json._
import com.dici.gitStats.data.GitStatsJsonProtocol._

class GitStatsServiceActor extends Actor with GitStatsService {
  def actorRefFactory = context
  implicit val system = context.system
  def receive         = runRoute(route)

  protected override def getCommits(repo: String) = {
    gitApiCall("repos/" + repo + "/commits")
      .map(_.entity.asString.parseJson.asInstanceOf[JsArray])
      .map(jsonArray => jsonArray.elements.map(extractBestPossibleCommitInfo).toList)
  }

  private def extractBestPossibleCommitInfo(value: JsValue) = {
    val commitNode    = value.getAsJsObject("commit")
    val authorNode    = value.getOptionalJsObject("author").getOrElse(commitNode.getAsJsObject("author"))
    val committerNode = value.getAsJsObject("commit").getAsJsObject("committer")

    val name          = authorNode   .getOptionalString("login"     ).orElse(authorNode.getOptionalString("name")).getOrElse("Unrecognized")
    val email         = committerNode.getAsString      ("email"     )
    val htmlUrl       = authorNode   .getOptionalString("html_url"  ).getOrElse("")
    val avatarUrl     = authorNode   .getOptionalString("avatar_url").getOrElse("")

    Commit(Committer(name, email, htmlUrl, avatarUrl), commitNode.getAsString("message"), committerNode.getAsString("date"))
  }

  implicit class JsValueToJsObject(value: JsValue) {
    private val node = value.asJsObject

    def getAsJsObject(key: String) = getOptionalJsObject(key).get
    def getOptionalJsObject(key: String) = node.fields.get(key).map(_.asJsObject)

    def getAsString(key: String) = getOptionalString(key).get
    def getOptionalString(key: String) = node.fields.get(key).map { case JsString(s) => s }
  }

  private def gitApiCall(endPoint: String) = (IO(Http) ? Get("https://api.github.com/" + endPoint)).mapTo[HttpResponse]
}

trait GitStatsService extends HttpService {
  val ROOT  = "git-stats"
  val route =
  (path(ROOT / "commits") & get) {
    parameter("repo") { repo =>
      complete {
        getCommits(repo).map(commits => DefaultJsonProtocol.listFormat[Commit].write(commits).prettyPrint)
      }
    }
  }

  protected def getCommits(repo: String): Future[List[Commit]]
}
