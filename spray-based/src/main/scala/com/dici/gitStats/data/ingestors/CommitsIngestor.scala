package com.dici.gitStats.data.ingestors

import com.dici.gitStats.data.{IngestedCommits, Commit, Committer}
import scala.collection.mutable.{ HashMap => MHashMap, ListBuffer }

class CommitsIngestor extends DataIngestor[Commit, IngestedCommits] {
  private val committersDedupedByProfileAndName = MHashMap[(String, String), Committer]()
  private val commits                           = ListBuffer[Commit]()

  override def ingest(commit: Commit) = {
    val committer = commit.committer
    committersDedupedByProfileAndName += (committer.html_url, committer.name) -> committer
    commits                           += commit
  }

  override def result = IngestedCommits(committersDedupedByProfileAndName.values.toList, commits.toList)
}