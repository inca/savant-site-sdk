package pro.savant
package sites

import circumflex._, xml._, cache._
import java.net.URL
import java.io.{IOException, FileOutputStream, File}
import org.apache.commons.io.{FileUtils, IOUtils}
import collection.JavaConversions._

class Community
    extends StructHolder {

  def elemName = "community"

  protected val _id = attr("id")
  def id = _id()

  protected val _title = text("title")
  def title = _title.getOrElse("")

  protected val _shortTitle = text("short-title")
  def shortTitle = _shortTitle.getOrElse("")

  protected val _icon = text("icon")
  def icon = _icon.getOrElse("")

  protected val _baseHref = text("base-href")
  def baseHref = _baseHref()

  protected val _secureBaseHref = text("secure-base-href")
  def secureBaseHref = _secureBaseHref()

  def rootDir = new File(root, "communities/" + id)

  def cssDir = new File(rootDir, "css")

  def cssFiles = FileUtils
      .listFiles(cssDir, Array("css"), true)
      .toSeq

  def cssUrls = {
    val prefix = cssDir.getCanonicalPath
    cssFiles.flatMap { f =>
      val p = f.getCanonicalPath
      if (p.startsWith(prefix))
        Some("/css/" + p.substring(prefix.length).replaceAll("^/", ""))
      else None
    }
  }

  def layoutFtl = new File(root, "layouts/" + id + ".ftl")

  def downloadLayoutFtl() {
    try {
      def url = new URL(baseHref + "/layout.ftl")
      LOG.info("Downloading " + url.toString)
      layoutFtl.getParentFile.mkdirs()
      val is = url.openStream()
      val out = new FileOutputStream(layoutFtl)
      try {
        IOUtils.copy(is, out)
      } finally {
        is.close()
        out.close()
      }
    } catch{
      case e: IOException =>
        LOG.error("Could not download template file.", e)
    }
  }

  lazy val ftlConf = {
    downloadLayoutFtl()
    new SiteFtlConf(this)
  }

}

class Communities
    extends ListHolder[Community]
    with XmlFile
    with Cached {

  def elemName = "communities"

  override def expired = false

  def descriptorFile = new File(root, "communities.xml")

  def read = {
    case "community" => new Community
  }

  override def load(): this.type = try {
    val url = communitiesXmlUrl
    val is = url.openStream()
    LOG.info("Downloading " + url.toString)
    try {
      loadFrom(is)
      // Caching locally
      save()
    } finally {
      is.close()
    }
    this
  } catch {
    case e: IOException =>
      LOG.error("Could not download communities list.", e)
      super.load()
      this
  }

}