package com.dici.gitStats.service

import akka.actor.Actor
import akka.io.IO
import akka.pattern.ask
import com.dici.gitStats.Boot._
import com.dici.gitStats.Boot.system.dispatcher
import com.dici.gitStats.data.GitStatsJsonProtocol._
import com.dici.gitStats.data.ingestors.CommitsIngestor
import com.dici.gitStats.data.mappers.RawCommitsMapper
import com.dici.gitStats.data.{Commit, IngestedCommits}
import spray.can.Http
import spray.http.HttpResponse
import spray.httpx.RequestBuilding._
import spray.httpx.SprayJsonSupport._
import spray.json._
import spray.routing._

import scala.concurrent.Future

object GitStatsServiceActor {
  private val RAW_COMMITS_MAPPER = new RawCommitsMapper
}

class GitStatsServiceActor extends Actor with GitStatsService {
  def actorRefFactory = context
  implicit val system = context.system
  def receive         = runRoute(route)

  override def getCommits(repo: String): Future[List[Commit]] =
    gitApiCall("repos/" + repo + "/commits?per_page=100") >>: GitStatsServiceActor.RAW_COMMITS_MAPPER

  override def getIngestedCommits(repo: String) = getCommits(repo) >>: new CommitsIngestor
  private def gitApiCall(endPoint: String) = (IO(Http) ? Get("https://api.github.com/" + endPoint)).mapTo[HttpResponse]
}

trait GitStatsService extends HttpService {
  val ROOT  = "git-stats"
  val route =
    pathPrefix(ROOT / "[^/]+".r / "[^/]+".r) { (owner, repo) =>
      pathPrefix("commits") {
        (pathEnd & get) {
          complete {
            getCommits(owner + "/" + repo).map(commits => DefaultJsonProtocol.listFormat[Commit].write(commits))
          }
        } ~
          pathPrefix("process") {
            pathEnd {
              complete {
                getIngestedCommits(owner + "/" + repo)
              }
            }
          }
      }
    }

  private def gitApiCall(endPoint: String) = (IO(Http) ? Get("https://api.github.com" + endPoint)).mapTo[HttpResponse]

  def getCommits        (repo: String): Future[List[Commit]]
  def getIngestedCommits(repo: String): Future[IngestedCommits]
}