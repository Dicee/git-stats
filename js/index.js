if (params.action === "search" && params.keyword != undefined) search(params.keyword);

function search(keyword) {
    if (keyword) searchRepository(keyword, listRepositories);
    else         noResult();
}

function listRepositories(response) {
    var repos = response.items;
    if (repos.length == 0) {
        noResult();
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

function noResult() { addItem(document.createTextNode("No results to display")); }

function addItem(child) {
    var item = document.createElement("li");
    item.appendChild(child);

    var div = document.createElement("div");
    div.setAttribute("class", "col-md-4");
    div.appendChild(item);

    var results = document.getElementById("searchResults");
    results.appendChild(div);
}