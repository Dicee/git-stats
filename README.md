# git-stats

A simple mini-project using the Github V3 API for generating basic stats on Github repositories. I started this as a recreational full Javascript application (although I hate Javascript), but I ended up wanting to write a wrapper REST service in Scala to practice my favourite language. That's why there's a `full-js` and a `spray-based` folder. I won't work on the full JS application anymore, keeping it only for history.

#### Note

I zipped the contents of `full-js` so that Github does not count them as JS on the repository, since it is mostly a duplicate of the JS under `spray-based`.

## Technologies 

### Client-side

- HTML, CSS, Javascript (no kidding ?)
- Google Charts
- Bootstrap

### Server-side

- Scala
- spray-can
- spray-routing
- spray-json

### Build

- sbt

## Getting started

### full-js

You'll need a browser, which you probably already have if you're reading this.

### spray-based

#### Pre-requisites

- JDK 7+
- sbt

#### Run the server

```
cd git-stats/spray-based
sbt
```

On the first run, this will download all the required dependencies and build the project. Then, you can run `re-start` to start the server and `re-stop` to shut it down.

