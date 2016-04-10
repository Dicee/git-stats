search(params.keyword);

function search(keyword) {
    if (keyword) searchRepository(keyword, listRepositories, onerror);
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
        link.href      = "show-repo.html?repo=" + repos[i].full_name;
        link.alt       = "See repository " + repos[i].full_name;
        link.innerHTML = repos[i].full_name;
        addItem(link, repos.length, i);
    }
}

function noResult() { addItem(document.createTextNode("No results to display"), 1, 0); }

function addItem(child, numberOfItems, index) {
    var item = document.createElement("li");
    item.appendChild(child);

    var div = document.createElement("div");
    div.appendChild(item);

    var numberOfLists = 3;
    var assignedList  = parseInt(index * numberOfLists / numberOfItems);
    var results       = document.getElementById("searchResults-" + assignedList);
    results.appendChild(div);
}