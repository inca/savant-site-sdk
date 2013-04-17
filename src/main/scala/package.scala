package pro.savant

import pro.savant.circumflex._, core._, cache._, web._
import java.io.File
import java.net.URL

package object sites {

  val LOG = new Logger("pro.savant.sites")

  val root = new File(System.getProperty("user.home"), ".savant.pro/sites")

  val communitiesXmlUrl = new URL("http://savant.pro/communities.xml")

  val _communities = new CacheCell[Communities](new Communities().load())
  def communities = _communities.get

  def communityOption = session.getAs[Community]("community")

  root.mkdirs()

}