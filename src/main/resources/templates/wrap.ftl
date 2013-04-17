[#ftl]
<!doctype html>
<html>
  <head>
    <title>SAVANT.PRO Sites Development Kit</title>
    <link type="text/css"
          rel="stylesheet"
          href="/css/themes/cx.css"/>
    <script type="text/javascript" src="/js/jquery.js">
    </script>
    <script type="text/javascript" src="/js/jquery.ui.min.js">
    </script>
    <script type="text/javascript" src="/svc/locale.js">
    </script>
    <script type="text/javascript" src="/js/ea.ui.js">
    </script>
    <script type="text/javascript">
      $(function() {
        eaui.init();
      });
    </script>
  </head>
  <body>
    <div id="outer">
      <div id="header"
           class="heavy">
        <div class="cell logo no-mobile">
          <img src="/img/savant-owl.png"/>
        </div>
        <div class="cell">
          <div class="title">savant.pro/dev</div>
          <div class="subtitle">Sites development toolkit</div>
        </div>
      </div>
      <div id="content">
      ${main}
      </div>
      <div id="footer">
        <div class="centered">
          <a href="http://savant.pro/"
             class="sav-logo no-icon"
             title="SAVANT.PRO"
             target="_blank">
            <img src="/img/savant-logo-small.png"/>
          </a>
        </div>
        <div>
          <span>2012</span>
          <span>&copy;</span>
          <a href="http://savant.pro"
             class="no-icon"
             target="_blank">Territoriya Obrazovaniya OOO</a>
        </div>
        <div class="powered-by">
          <span>Powered by</span>
          <a class="cx no-icon"
             href="http://circumflex.ru"
             target="_blank">Circumflex</a>
        </div>
      </div>
    </div>
  </body>
</html>