if (params.action === "search" && params.keyword) search(params.keyword);

function search(keyword) {
    callGitApi("search/repositories?q=" + keyword, listRepositories);
}

function listRepositories(response) {
    var results = document.getElementById("searchResults");
    var addItem = function(child) {
        var item  = document.createElement("li");
        item.appendChild(child);
        results.appendChild(item);
    }

    var repos = response.items;
    if (repos.length == 0) {
        addItem(document.createTextNode("No result to display"));
        return;
    }

    for (var i = 0; i < repos.length; i++) {
        var link       = document.createElement("a");
        link.href      = "show-repo.html?action=show-repo&repo=" + repos[i].full_name;
        link.alt       = "See repository " + repos[i].full_name;
        link.innerHTML = repos[i].full_name;
        addItem(link);
    }
}