function initSmartDiff(elem) {

  var $this = $(elem);

//  var r = /^\s*---\s*\{\.conflict\.(\S+)\.(\S+)\}/mg;
//  $this.html($this.html().replace(r, "<hr class='conflict $1 $2'/>"));

  processInsDel("insert");
  processInsDel("delete");

  function processInsDel(cl) {
    $(".conflict." + cl + ".start", $this).each(function() {
      var start = $(this);
      var content = start.nextUntil(".conflict." + cl + ".end");
      var wrap = $('<div class="conflict ' + cl + '"></div>');
      wrap.append('<div class="diff-title">' + msg['diff.' + cl] + '</div>');
      wrap.append(content);
      wrap.attr("data-source-index", start.attr("data-source-index"));
      start.replaceWith(wrap);
      wrap.next().remove();
    });
  }

  $(".conflict.change.original", $this).each(function() {
    var wrap = $('<div class="conflict change"></div>');
    var start = $(this);
    var original = start.nextUntil(".conflict.change.revised");
    var origWrap = $('<div class="original"></div>');
    origWrap.append('<div class="diff-title">' + msg['diff.change.original'] + '</div>');
    origWrap.append(original);
    start.next().remove();
    var revised = start.nextUntil(".conflict.change.end");
    var revWrap = $('<div class="revised"></div>');
    revWrap.append('<div class="diff-title">' + msg['diff.change.revised'] + '</div>');
    revWrap.append(revised);
    wrap.append(origWrap);
    wrap.append(revWrap);
    wrap.attr("data-source-index", start.attr("data-source-index"));
    start.replaceWith(wrap);
    wrap.next().remove();
  });

}

function initPartialEdit(elem) {

  var $this = $(elem);

  var editUrl = $this.attr("data-edit-url");
  var refreshUrl = $this.attr("data-refresh-url");

  function refresh() {
    $.get(refreshUrl, {}, function(data) {
      var cnt = $(data);
      $this.empty().append(cnt);
      eaui.init($this);
    }, "html");
  }

  initSmartDiff(elem);

  $this.children("[data-source-index]").each(function() {
    if ($this.hasClass("disabled")) return;
    var chunk = $(this);
    // wrap the chunk with an edit handle
    var wrapper = $('<div class="edit-wrapper"></div>');
    chunk.after(wrapper);
    wrapper.append(chunk);
    // copy data-source-index attributes
    wrapper.attr("data-source-index", chunk.attr("data-source-index"));
    var handle = $('<div class="edit-handle"></div>');
    handle.attr("title", msg['item.partial.title']);
    wrapper.append(handle);
    // configure handle
    handle.bind("click.eaui", function() {
      var params = {};
      params.start = wrapper.attr("data-source-index");
      var end = wrapper.next().attr("data-source-index");
      if (end) params.end = parseInt(end) - 1;
      var height = chunk.outerHeight() + 48;
      if (height < 64) height = 64;
      $.get(editUrl, params, function(data) {
        chunk.replaceWith(data);
        eaui.init($this);
        // remove allPages handles, so the component must reinitialize
        $(".edit-handle", $this).remove();
        // configure textarea
        var textarea = $("textarea");
        textarea.focus();
        textarea.height(height);
        var form = $("#partial-edit-form");
        form.bind("postSubmit.eaui", function() {
          refresh();
        });
        $(".cancel", form).bind("click.eaui", function() {
          refresh();
        });
      }, "html");
    });
  });

}

function initCountdowns(elem) {
  var span = $(elem);
  var seconds = Math.round(parseFloat(span.attr("data-countdown")) / 1000);
  span.countdown({
    until: "+" + seconds + "s",
    compact: true,
    format: "hMS",
    onTick: function(periods) {
      if (periods[5] < 1) span.addClass("critical");
    },
    onExpiry: function() {
      setTimeout(function() { window.location.reload(true) }, 1000);
    }
  });
}

function initCourseStickies(elem) {

  var cnt = $(elem);
  var url = cnt.attr("data-stickies-url");

  function createSticky(text, index) {
    var id = Math.random().toString(16);
    var wrapper = $('<div class="course-sticky"/>');
    wrapper.attr("data-id", id);
    wrapper.attr("data-index", index);
    // Textarea
    var textarea = $('<textarea name="st_' + id + '"/>');
    textarea.val(text);
    // Inputs
    var indexInput = $('<input type="hidden" name="si_' + id + '"/>');
    indexInput.val(index);
    var idInput = $('<input type="hidden" name="sticky"/>');
    idInput.val(id);
    // Handles
    var handleMove = $("<span class='handle-move'/>");
    handleMove.attr("title", msg['course.sticky.move']);
    handleMove.hide();
    var handleDelete = $("<span class='handle-delete'/>");
    handleDelete.attr("title", msg['course.sticky.delete']);
    handleDelete.hide();
    // Assemble
    wrapper
        .append(textarea)
        .append(indexInput)
        .append(idInput)
        .append(handleMove)
        .append(handleDelete);
    wrapper.tilt();
    // Attach events
    textarea.bind("focus.eaui", function() {
      handleMove.show();
      handleDelete.show();
      wrapper.untilt();
    });
    textarea.bind("blur.eaui", function() {
      handleMove.fadeOut(300);
      handleDelete.fadeOut(300);
      wrapper.tilt();
    });
    textarea.bind("keydown.eaui", function() {
      handleMove.fadeOut(300);
      handleDelete.fadeOut(300);
    });
    textarea.bind("change.eaui", function() {
      postStickies();
    });
    handleDelete.bind("click.eaui", function() {
      wrapper.fadeOut(300, function() {
        wrapper.remove();
        postStickies();
      });
    });
    return wrapper;
  }

  function insertSticky(wrapper) {
    var idx = parseInt(wrapper.attr("data-index"));
    cnt.insertAt(idx, wrapper);
  }

  function updateStickies() {
    $(".course-sticky", cnt).each(function() {
      var wrapper = $(this);
      var index = wrapper.index();
      var id = wrapper.attr("data-id");
      wrapper.attr("data-index", index);
      $("[name='si_" + id + "']", wrapper).val(index);
    });
  }

  function initStickies() {
    // Init existing stickies
    $(".course-sticky-init", cnt).each(function() {
      var e = $(this);
      var sticky = createSticky(e.text(), e.attr("data-index"));
      e.remove();
      insertSticky(sticky);
    });
    // Make 'em sortable
    $("> *:not(.course-sticky)", cnt).addClass("ea-stickies-nosort");
    cnt.sortable({
      cancel: '.ea-stickies-nosort',
      placeholder: 'course-sticky-placeholder',
      handle: '.handle-move'
    });
    cnt.bind("sortupdate.eaui", function() {
      updateStickies();
      postStickies();
    });
    // Initialize add sticky button
    var addButton = $('#course-sticky-add');
    addButton.bind("click.eaui", function() {
      var wrapper = createSticky("", 0);
      insertSticky(wrapper);
      updateStickies();
      $("textarea", wrapper).focus();
    });
  }

  function postStickies() {
    var params = $(".course-sticky :input", cnt).serialize();
    $.ajax({
      url: url,
      type: "POST",
      data: params,
      error: eaui.processAjaxError
    });
  }

  initStickies();

}

function initAudio(elem) {
  var regex = new RegExp(".+\\.(.+?)\\?.+");
  var audio = $(elem);
  var audioCnt = audio.html();
  var res = regex.exec(audio.attr("src"));
  if (!(res[1] && elem.canPlayType("audio/"+ res[1]) != "")) {
    audio.replaceWith(audioCnt);
  }
}

function initIssuesVotes(elem) {
  var cnt = $(elem);
  var url = cnt.attr("data-vote-url");
  $("a", cnt).click(function() {
    $.ajax({
      type: "post",
      url: url,
      data: {
        "__": new Date().getTime().toString()
      },
      dataType: "json",
      success: function(data) {
        if (data.error) {
          eaui.notices.clear();
          eaui.notices.addError(msg[data.error]);
        } else {
          // update rating
          var rating = $(".rating", cnt);
          var r = parseInt(rating.text());
          rating.text(r + 1);
        }
      },
      error: eaui.processAjaxError
    });
  });
}


$(document)
    .unbind(".course-init")
    .bind("ea-load.course-init.eaui", function(ev, data) {

      data.ctx.lookup(".partial-edit").each(function() {
        initPartialEdit(this);
      });

      data.ctx.lookup('*[data-countdown]').each(function(){
        initCountdowns(this);
      });

      data.ctx.lookup("*[data-stickies-url]").each(function() {
        initCourseStickies(this);
      });

      data.ctx.lookup("audio").each(function() {
        initAudio(this);
      });
      data.ctx.lookup(".issue-votes").each(function(){
        initIssuesVotes(this);
      })
    });

