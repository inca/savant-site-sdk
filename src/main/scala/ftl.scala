package pro.savant
package sites

import circumflex._, core._, web._, markeven._, freemarker._
import _root_.freemarker.template.{TemplateExceptionHandler, Configuration}
import _root_.freemarker.cache.{TemplateLoader, MultiTemplateLoader, ClassTemplateLoader, FileTemplateLoader}
import _root_.freemarker.log.{Logger => FLogger}
import java.io.File

trait BaseFtlConf extends Configuration {

  FLogger.selectLoggerLibrary(FLogger.LIBRARY_NONE)
  setObjectWrapper(new ScalaObjectWrapper())
  setTemplateExceptionHandler(TemplateExceptionHandler.RETHROW_HANDLER)
  setDefaultEncoding("utf-8")
  setSetting("datetime_format", "EEE, d MMM yyyy HH:mm:ss Z")
  setNumberFormat("0.##")
  setSetting(Configuration.CACHE_STORAGE_KEY, "strong:400, soft:16000")

  setSharedVariable("me", MarkevenDirective)

  override def getLocale = msg.locale
}

object SystemFtlConf extends BaseFtlConf {

  val srcTemplates = new File("src/main/resources/templates")
  val classLoader = new ClassTemplateLoader(this.getClass, "/templates")

  val loaders =
    if (srcTemplates.isDirectory)
      Array[TemplateLoader](new FileTemplateLoader(srcTemplates), classLoader)
    else Array[TemplateLoader](classLoader)

  setTemplateLoader(new MultiTemplateLoader(loaders))

}

object LayoutsFtlConf extends BaseFtlConf {

  val templatesRoot = new File(root, "layouts")

  templatesRoot.mkdirs()

  setTemplateLoader(
    new FileTemplateLoader(templatesRoot))
}

class SiteFtlConf(val community: Community)
    extends BaseFtlConf {

  community.rootDir.mkdirs()

  setTemplateLoader(
    new FileTemplateLoader(community.rootDir))

}

class SiteFtlData(protected val $community: Community) {

  def baseHref = $community.baseHref

  def secureBaseHref = $community.secureBaseHref

  def authenticated = param.contains("auth")

  def joined = param.contains("joined")

  def staff = param.contains("staff")

  def userTitle = param.getString("title").getOrElse("Dear User")

}