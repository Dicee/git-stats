function link(href, innerHTML, attributes) {
    var a       = document.createElement("a");
    a.href      = href;
    a.innerHTML = innerHTML;
    setAttributes(a, attributes);
    return a;
}

function img(src, attributes) {
    var img = document.createElement("img");
    img.src = src;
    setAttributes(img, attributes);
    return img;
}

function simpleContainer(tag, ...children) {
    return container(tag, null, ...children);
}

function container(tag, attributes, ...children) {
    var res  = document.createElement(tag);
    for (let child of children) res.appendChild(child);
    setAttributes(res, attributes);
    return res;
}

function text(str) {
    return document.createTextNode(str);
}

function setAttributes(elt, attributes) {
    if (attributes) {
        for (let key of Object.keys(attributes)) elt.setAttribute(key, attributes[key])
    }
}
