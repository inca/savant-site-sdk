[#ftl]

[#assign main]
<div class="letterbox">
  <div class="wrap content-output content-box">
    <h1>Welcome!</h1>
    <p>Please choose the community to edit:</p>
    [#list communities.children as community]
      <a href="/~${community.id}"
         class="pill primary small">
        <img src="${community.icon}"
             class="glyph"/>
        <span>${community.title}</span>
      </a>
    [/#list]
  </div>
</div>
[/#assign]

[#include "wrap.ftl"/]