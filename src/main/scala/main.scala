package pro.savant
package sites

import pro.savant.circumflex._, core._, web._, freemarker._
import java.io.{File, StringWriter}

class Main extends Router {

  get("/~reset") = {
    session -= "community"
    communities.invalidate()
    sendRedirect("/")
  }

  communityOption match {

    case Some(community) =>

      get("/css/*") = {
        response.contentType("text/css")
        val file = new File(community.cssDir, uri(1))
        if (file.isFile)
          sendFile(file)
        else sendError(404)
      }

      get("/*").and(!uri(1).endsWith(".p")) = {
        val template = community.ftlConf.getTemplate("/" + uri(1) + ".ftl")
        val result = new StringWriter
        template.process(new SiteFtlData(community), result)
        'main := markeven.DEFAULT_RENDERER.sanitizer.sanitize(result.toString)
        'stylesheets := community.cssUrls
            .map(u => "<link" +
            " rel=\"stylesheet\"" +
            " href=\"" + u + "\"" +
            " type=\"text/css\"/>")
            .mkString("\n")
        response.body { r =>
          LayoutsFtlConf
              .getTemplate(community.id + ".ftl")
              .process(ctx, r.getWriter)
        }.flush()
      }

    case _ =>

      get("/?") = {
        'communities := communities
        ftl("/list.ftl")
      }

      get("/~:id") = communities.children.find(_.id == param("id")) match {
        case Some(community) =>
          session += "community" -> community
          sendRedirect("/")
        case _ =>
          sendError(404)
      }

  }

}