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
import com.dici.gitStats.service.Pages._
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
  val root     = "git-stats"
  val apiRoot  = root + "-api"

  val apiRoute =
    pathPrefix(apiRoot / "[^/]+".r / "[^/]+".r) { (owner, repo) =>
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

  val webRoute =
    pathPrefix(root) {
      serveResourceWithParam(INDEX, "keyword") ~
      pathPrefix("show-repo") { serveResourceWithParam(SHOW_REPO, "repo") }
    } ~ getFromResourceDirectory("web")

  val route = webRoute ~ apiRoute

  private def serveResourceWithParam(page: String, param: String) =
    pathEnd {
      parameter(param) { repo =>
        getFromResource(page)
      }
    }

  def getCommits        (repo: String): Future[List[Commit]]
  def getIngestedCommits(repo: String): Future[IngestedCommits]
}

object Pages {
  val INDEX     = "web/index.html"
  val SHOW_REPO = "web/show-repo.html"
}