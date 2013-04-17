/* SAVANT.PRO UI support

 Dependencies:

 * JQuery 1.7.1
 * JQuery UI 1.8

 */

(function($) {

  // Lookup function

  $.fn.lookup = function(selector) {
    var elems = this.find(selector);
    if (this.is(selector))
      return elems.add(this);
    else return elems;
  };

  // Insert at index function

  $.fn.insertAt = function(index, element) {
    var lastIndex = this.children().size();
    if (index < 0) {
      index = Math.max(0, lastIndex + 1 + index)
    }
    this.append(element);
    if (index < lastIndex) {
      this.children().eq(index).before(this.children().last());
    }
    return this;
  };

  // Close dateinput calendar

  $.closeDateinput = function() {
    var api = $(":input.date").data("dateinput");
    if (api && api.hide)
      api.hide();
  };

  // Insert-at-caret

  $.fn.insertAtCaret = function(value) {
    return this.each(function() {
      if (document.selection) {
        this.focus();
        var sel = document.selection.createRange();
        sel.text = value;
        this.focus();
      } else if (typeof(this.selectionStart) != "undefined") {
        var startPos = this.selectionStart;
        var endPos = this.selectionEnd;
        var scrollTop = this.scrollTop;
        this.value = this.value.substring(0, startPos) +
            value + this.value.substring(endPos,this.value.length);
        this.focus();
        this.selectionStart = startPos + value.length;
        this.selectionEnd = startPos + value.length;
        this.scrollTop = scrollTop;
      } else {
        this.value += value;
        this.focus();
      }
    })
  };

  // Tilt

  $.fn.tilt = function() {
    this.each(function() {
      var e = $(this);
      var angle = (Math.random() * 8) - 4;
      e.css("-webkit-transform", "rotate(" + angle + "deg)");
      e.css("-moz-transform", "rotate(" + angle + "deg)");
      e.css("-o-transform", "rotate(" + angle + "deg)");
    });
    return this;
  };

  $.fn.untilt = function() {
    this.css("-webkit-transform", "rotate(0deg)");
    this.css("-moz-transform", "rotate(0deg)");
    this.css("-o-transform", "rotate(0deg)");
    return this;
  };

  // Toggles

  $.fn.toggler = function() {

    this.each(function() {

      var $this = $(this);

      var buttons = $("*[data-for]", $this);

      function updateButtons() {
        buttons.each(function() {
          var b = $(this);
          var target = $(b.attr("data-for"));
          if (target.is(":visible"))
            b.addClass("active");
          else b.removeClass("active");
        });
      }

      buttons.bind("click.eaui.toggler", function(ev) {
        ev.preventDefault();
        var b = $(this);
        // hide allPages targets
        buttons.each(function() {
          $($(this).attr("data-for")).hide();
        });
        // show this one
        $(b.attr("data-for")).show();
        // update buttons state
        updateButtons();
        return false;
      });

      updateButtons();

    });

    return this;

  };

  // Switcher

  $.fn.switcher = function(options) {

    return this.each(function() {

      var $switcher = $(this);

      var target = options.target ?
          $(options.target) : $($switcher.attr("data-target"));
      var mode = options.mode;

      var filtered = target.filter(function() {
        return $(this).lookup($switcher).size() == 0;
      });

      function _update() {
        if (filtered.is(":visible"))
          $switcher.removeClass("active").addClass("active");
        else $switcher.removeClass("active");
      }

      _update();

      function _toggle() {
        $switcher.toggleClass("active");
        if (mode == "slide")
          target.slideToggle(300, _update);
        else if (mode == "fade")
          target.fadeToggle(300, _update);
        else target.toggle(0, _update);
      }

      $switcher.bind("click.eaui.switcher", function() {
        _toggle();
        return false;
      });

      $("html").bind("click.eaui.switcher", function() {
        if ($switcher.hasClass("active")
            && $switcher.is(":visible"))
          _toggle();
      });

    });

  };

  // Field autocomplete

  $.fn.fieldAutocomplete = function() {

    return this.each(function() {

      var input = $(this);
      input.attr("autocomplete", "off");

      var target = $(input.attr("data-autocomplete"));

      input.switcher({ target: target });

      target.lookup("*[data-value]").bind("click.eaui", function() {
        var e = $(this);
        var value = e.attr("data-value");
        input.val(value).click().blur();
      });

    });

  };

  // Partial forms

  $.fn.partial = function() {

    return this.each(function() {

      var $form = $(this);

      var stay = $form.hasClass("stay");
      var readonly = $form.hasClass("readonly");
      var action = $form.attr("action");
      var method = $form.attr("method").toUpperCase();

      $form.bind("submit.eaui.partial", function(ev, data) {
        if (readonly) return false;
        // replace submission buttons with loading placeholder temporarily
        var ph = eaui.placeholder();
        var submits = $(".submits", $form);
        submits.hide();
        ph.insertAfter(submits);
        // prepare params
        var params = $(":not(.exclude)", $form).serializeArray();
        params.push({
          name: "__",
          value: new Date().getTime().toString()
        });
        if (data && data.params) {
          params = params.concat(data.params);
        }
        // execute pre-submit event
        if (typeof($form[0]._preSubmit) == "function") {
          $form[0]._preSubmit({ params: params });
        }
        eaui.log(method + " " + action + " " + JSON.stringify(params));
        if (method == "GET") {
          var url = action + "?" + $.param(params);
          eaui.navigate(url);
        } else {
          // perform ajax submit
          $.ajax({
            data: params,
            dataType: "json",
            url: action,
            type: method,
            success: function(data) {
              $form.trigger("postSubmit", data);
              forms.processResponse(data, stay);
              submits.show();
              ph.remove();
              $("input[type='password'], .cleanup", $form).val("");
            },
            error: function(xhr) {
              submits.show();
              ph.remove();
              eaui.processAjaxError(xhr);
            }
          });
        }
        // prevent actual submit
        ev.preventDefault();
        return false;
      });

    });

  };

  // Forms with local storage

  $.fn.localStore = function() {

    if (!window.sessionStorage)
      return this;

    var prefix = $.sha256(location.href.replace(/\?.*/g, "")) + ":";

    return this.each(function() {

      var input = $(this);
      var id = input.attr("id");
      var name = input.attr("name");
      var type = input.attr("type");

      if (!type) {
        if (input[0].tagName.toLowerCase() == "select")
          type = "select";
        else if (input[0].tagName.toLowerCase() == "textarea")
          type = "textarea";
      }

      if (!id || !name || !type || eaui.forms.inputTypes.indexOf(type) == -1) {
        eaui.log("Undefined id, name or type for localstore input.");
      }

      function getKey() {
        var key = input.attr("data-localstore-key");
        if (!key)
          key = prefix;
        if (type == "radio")
          key += name;
        else key += id;
        return key;
      }

      function getValue() {
        if (type == "checkbox")
          return input.is(":checked").toString();
        else if (type == "radio")
          return $(":input[name='" + name + "']:checked").attr("id");
        else if (type == "select")
          return $("option:selected", input).attr("id");
        else return input.val(); // TODO check with type=date
      }

      function store() {
        sessionStorage.setItem(getKey(), getValue());
      }

      function restore() {
        var value = sessionStorage.getItem(getKey());
        if (!value) return;
        if (type == "checkbox") {
          if (value == "true")
            input.attr("checked", "checked");
          else if (value == "false")
            input.removeAttr("checked");
        } else if (type == "radio") {
          $("#" + value).attr("checked", "checked");
        } else if (type == "select") {
          $("option#" + value, input).attr("selected", "selected");
          input.trigger("change");
        } else input.val(value);
      }

      input.unbind(".localstore")
          .bind("change.eaui.localstore", store)
          .bind("keyup.eaui.localstore", store);

      restore();

    });

  };

  // Hints

  $.fn.hint = function() {

    this.each(function() {

      var hint = $(this);

      var prompt = $(".prompt", hint);

      if (prompt.size() < 1)
        prompt = $('<p class="prompt">' + msg['hint.prompt'] + '</p>');

      var promptA = $('<a href="javascript:;"/>').append(prompt);

      promptA.insertAfter(hint);
      hint.hide();

      promptA.bind("click.eaui", function() {
        var m = hint.clone().show().removeClass("hint");
        var ctls = $('<div class="centered"></div>');
        ctls.append('<a href="javascript:;" class="close btn alternate">' +
            msg['Close'] + '</a>');
        var content = $('<div class="content-output"/>')
            .append(m)
            .append('<hr/>')
            .append(ctls);
        eaui.ibox.show(content);
      });

    });

    return this;

  };

  // Search form

  $.fn.searchForm = function() {

    this.each(function() {
      var $form = $(this);
      var $cnt = $($form.attr("data-search-container"));

      var method = $form.attr("method");
      var action = $form.attr("action");

      $form.bind("submit.eaui.searchForm", function(ev) {
        // insert placeholder into container
        var ph = eaui.placeholder();
        $cnt.empty().append(ph);
        // prepare params
        var params = $(":not(.exclude)", $form).serializeArray();
        params.push({"name": "__", "value": new Date().getTime().toString()});
        // execute pre-submit event
        if (typeof($form[0]._preSubmit) == "function") {
          $form[0]._preSubmit({ params: params });
        }
        eaui.log(method + " " + action + " " + JSON.stringify(params));
        // perform ajax request
        $.ajax({
          data: params,
          dataType: "html",
          url: action,
          type: method,
          success: function(data) {
            $form.trigger("postSubmit", data);
            ph.remove();
            $cnt.append(data);
            eaui.init($cnt);
          },
          error: function(xhr) {
            ph.remove();
            eaui.processAjaxError(xhr);
          }
        });
        // prevent actual submit
        ev.preventDefault();
        return false;
      });

    });

    return this;

  };

  // IBox

  $.fn.ibox = function() {
    var href = this.attr("href");
    eaui.ibox.load(href);
    return this;
  };

  // Autoresizing textarea

  $.fn.autoResize = function() {

    this.filter("textarea").each(function() {

      var textarea = $(this);
      var origHeight = textarea.height();

      // Remove scrollbars and resize handles
      textarea.css({ resize: 'none', 'overflow-y': 'hidden' });

      // We need a clone to calculate scrollHeight on it
      var clone = (function(){

        // Properties which may effect space taken up by chracters
        var props = ['height','width','lineHeight','textDecoration','letterSpacing'];
        var propOb = {};
        $.each(props, function(i, prop) {
          propOb[prop] = textarea.css(prop);
        });

        // Clone the actual textarea removing unique properties
        return textarea.clone().removeAttr('id').removeAttr('name').css({
          position: 'absolute',
          top: 0,
          left: -9999
        }).css(propOb).attr('tabIndex','-1').insertBefore(textarea);

      })();

      var lastScrollTop = 0;

      function updateSize() {
        clone.height(0).val(textarea.val()).scrollTop(10000);
        var scrollTop = Math.max(clone.scrollTop(), origHeight);
        if (lastScrollTop == scrollTop)
          return;
        lastScrollTop = scrollTop;
        textarea.add(clone).height(scrollTop + 32);
      }

      updateSize();
      textarea.bind("keydown.eaui.autoResize", updateSize);
      textarea.bind("keyup.eaui.autoResize", updateSize);
      textarea.bind("change.eaui.autoResize", updateSize);

    });

    return this;

  };

  // Notices

  var notices = {
    container: function() {
      return $("#notices")
    },
    hasError: function() {
      return $(".notice.error:not(:animated)", notices.container()).size() > 0;
    },
    stash: function() {
      var cnt = notices.container();
      // delete animating notices before stashing
      $(".notice:animated", cnt).remove();
      window.sessionStorage.setItem("ea-notices", cnt.html());
      cnt.empty();
    },
    unstash: function() {
      var html = window.sessionStorage.getItem("ea-notices");
      if (html) {
        notices.container().append(html);
        window.sessionStorage.removeItem("ea-notices");
      }
    },
    initElem: function(elem) {
      var e = $(elem);
      $(".hide", e).remove();
      if (e.hasClass("noclose")) return;
      var handle = $("<span class='hide'/>");
      handle.bind("click.eaui.notices", function() {
        notices.dispose(e);
      });
      e.prepend(handle);
      setTimeout(function() {
        notices.dispose(e);
      }, 10000);
    },
    clear: function() {
      notices.dispose($(".notice:not(.noclose)", notices.container()));
    },
    dispose: function(elems) {
      elems.fadeOut("fast", function() {
        $(this).remove();
      });
    },
    mkElem: function(notice) {
      var kind = notice.kind;
      var msg = notice.msg
          .replace(/&quot;/g, "\"")
          .replace(/&lt;/g,"<")
          .replace(/&gt;/g,">")
          .replace(/&amp;/g, "&");
      var e = $("<div class=\"notice " + kind + "\">" + msg +"</div>");
      notices.initElem(e);
      return e;
    },
    add: function(notice) {
      notices.container().append(notices.mkElem(notice));
    },
    addError: function(msg) {
      notices.add({kind: "error", msg: msg});
    },
    addWarn: function(msg) {
      notices.add({kind: "warn", msg: msg});
    },
    addInfo: function(msg) {
      notices.add({kind: "info", msg: msg});
    },
    addAll: function(data) {
      if (data && data.notices) {
        for (var i in data.notices) {
          var n = data.notices[i];
          notices.add(n);
        }
      }
    },
    init: function() {
      // unstash notices by default
      notices.unstash();
      // init controls for each notice
      $(".notice", notices.container()).each(function() {
        notices.initElem(this);
      });
      // dismiss on escape
      $(window).unbind(".eaui.notices")
          .bind("keydown.eaui.notices", function(ev) {
            if (ev.keyCode == 0x1B)
              notices.clear();
          });
    }
  };

  // Form processing helpers

  var forms = {
    inputTypes: ["text", "checkbox", "radio", "select", "textarea", "date"],
    processResponse: function(data, stay) {
      notices.clear();
      notices.addAll(data);
      if (data.redirect && !stay) {
        // handle redirect if necessary
        var href = data.redirect;
        // determine if replaceState can be used
        var useHistory = true;
        if (!window.history.replaceState)
          useHistory = false;
        var prefix = $("body").attr("data-workspace");
        if (!prefix || href.indexOf(prefix) != 0)
          useHistory = false;
        if (useHistory) {
          window.history.replaceState({href: href}, "", href);
          eaui.loadViewport(href);
        } else {
          notices.stash();
          window.location.replace(href);
        }
      }
    }
  };

  // Export top-level API into `eaui` object

  window.eaui = {

    log: function(str) {
      if (typeof(console) != "undefined" && typeof(console.log) == "function")
        console.log(str);
    },

    origin: function() {
      return location.protocol + "//" + location.host;
    },

    notices: notices,

    forms: forms,

    processAjaxError: function(xhr) {
      if (xhr.status == 0) return;
      else if (xhr.status == 401)
        notices.addWarn(msg["session.expired"]);
      else if (xhr.status == 502)
        notices.addError(msg["server.down"]);
      else if (xhr.status == 504)
        notices.addError(msg["request.timeout"]);
      else if (xhr.status == 403)
        notices.addError(msg["access.denied"]);
      else notices.addError(msg['ajax.failed']);
    },

    placeholder: function() {
      return $('<div class="loading"/>')
    },

    addListener: function (selector, func) {
      $(document).bind("ea-attach-listeners", attachListener);
      function attachListener() {
        var elem = $(selector);
        elem.addClass("ea-listeners");
        var listeners = elem.data("ea-listeners") || [];
        listeners.push(func);
        elem.data("ea-listeners", listeners);
      }
    },

    initWorkspace: function(ctx) {
      if (!window.history.pushState) return;
      var prefix = $("body").attr("data-workspace");
      if (!prefix) return;
      // init links
      var links = ctx
          .lookup("a[href^='" + prefix + "']")
          .filter("[rel!=popup]")
          .filter("[target!=_blank]");
      links.addClass("ea-partial-link");
      links.bind("click.eaui", function(ev) {
        if (ev.button == 0 && !(ev.metaKey || ev.ctrlKey)) {
          ev.preventDefault();
          var a = $(this);
          var href = a.attr("href");
          window.history.pushState({href: href}, "", href);
          eaui.loadViewport(href);
          return false;
        }
      });
    },

    loadViewport: function(href) {
      // Remove rubbish
      eaui.ibox.close();
      $.closeDateinput();
      $("#txtselect_marker").remove();
      // Trigger viewport unload
      var e = $.Event("viewportUnload");
      $(window).trigger(e);
      if (e.isDefaultPrevented()) return;
      // Adding "Please wait" overlay, hidden initially
      var overlay = $('<div id="viewport-standby"></div>');
      overlay.hide();
      $("body").append(overlay);
      overlay.append('<div class="message">' + msg['standby'] + '</div>');
      setTimeout(function() {
        overlay.fadeIn(300);
      }, 500);
      // Perform AJAX request
      $.ajax({
        url: href,
        headers: {"EA-Render-Mode": "partial-viewport" },
        dataType: "html",
        data: {
          "__": new Date().getTime().toString()
        },
        type: "GET",
        success: function(data) {
          var cnt = $(data);
          // Remove the overlay
          overlay.remove();
          // Insert the data
          $("#viewport").replaceWith(cnt).remove();
          // Initialize the container
          eaui.init(cnt);
          // See if site title needs to be replaced
          var newTitle = cnt.attr("data-title");
          if (newTitle) {
            $("head title").text(newTitle);
          }
          // Raise the event
          $("body").trigger("viewportNavigate");
          eaui.navigateToAnchor();
        },
        error: function(xhr) {
          eaui.processAjaxError(xhr);
          // Remove the overlay
          overlay.remove();
        }
      });
    },

    navigate: function(url) {
      if (window.history.pushState) {
        window.history.pushState({href: url}, "", url);
        eaui.loadViewport(url);
      } else {
        window.location.href = url;
      }
    },

    navigateToAnchor: function() {
      var hash = location.href.replace(/.*?(?=#|$)/, "");
      var scrollTarget = $(hash);
      if (scrollTarget.size() == 0)
        scrollTarget = $(".viewport-anchor").first();
      // Scroll the window up to anchor, if exists, or to the beginning
      // of the page.
      var scrollTop = 0;
      scrollTarget.each(function() {
        scrollTop = $(this).offset().top;
      });
      $("html, body").animate({
        "scrollTop": scrollTop
      }, 200);
    },

    danceIt: function() {
      $("body *").css("-webkit-transition", "-webkit-transform, 1s");
      $("body").append('<embed src="/maski.mp3" ' +
          'autostart="true" loop="true" height="0" width="0"/>');
      setInterval(function() {
        var elems = $("body *");
        elems.tilt();
      }, 550);
      $(document).bind("ea-load.eaui", function(ev, data) {
        data.ctx.lookup("*")
            .css("-webkit-transition", "-webkit-transform, 1s");
      });
    },

    ibox: {
      init: function() {
        var cnt = $("#ibox");
        if (cnt.size() > 0)
          return;
        cnt = $('<div id="ibox"></div>');
        cnt.hide();
        $("body").prepend(cnt);
        $(window)
            .unbind(".ibox")
            .bind("keydown.ibox", function(ev) {
              if (ev.keyCode == 0x1B)
                eaui.ibox.close();
            });
        cnt.bind("click", function(ev) {
          eaui.ibox.close();
        });
      },
      close: function() {
        $("#ibox iframe").remove();
        $.closeDateinput();
        $("#ibox").fadeOut(300, function() {
          $(this).remove();
        });
      },
      get: function() {
        eaui.ibox.init();
        return $("#ibox");
      },
      isVisible: function() {
        return $("#ibox").is(":visible");
      },
      load: function(href) {
        $.ajax({
          url: href,
          dataType: "html",
          type: "GET",
          data: {
            "__": new Date().getTime().toString()
          },
          success: function(data) {
            eaui.ibox.show(data);
          },
          error: eaui.processAjaxError
        });
      },
      show: function(data) {
        // Trigger viewport unload
        var e = $.Event("viewportUnload");
        $(window).trigger(e);
        if (e.isDefaultPrevented()) return;
        // Show ibox
        var cnt = eaui.ibox.get().empty();
        var wrapper = $('<div id="ibox-wrapper"></div>');
        wrapper.append(data);
        cnt.append(wrapper);
        var close = $('<div id="ibox-close"></div>');
        close.attr("title", msg['Close']);
        wrapper.append(close);
        cnt.fadeIn(300, function() {
          $("body").animate({scrollTop: cnt.offset().top}, 300);
          cnt.trigger("ibox_load");
          eaui.init(wrapper);
          wrapper
              .unbind(".ibox")
              .bind("click.eaui.ibox", function(ev) {
                ev.stopPropagation();
              });
          close.bind("click.eaui.ibox", function() {
            eaui.ibox.close();
          });
        });
      }
    },

    init: function(context) {

      var ctx = context == null ? $("body") : $(context);

      // Do not run over the empty context.
      if (ctx.size() == 0)
        return;

      // Unbind allPages previously bound events

      ctx.lookup("*").unbind(".eaui");

      // Workspace and partial navigation

      eaui.initWorkspace(ctx);

      // Execute listeners

      $(document)
          .trigger("ea-attach-listeners")
          .unbind("ea-attach-listeners");

      ctx.lookup(".ea-listeners").each(function() {
        var arr = $(this).data("ea-listeners") || [];
        $.each(arr, function(i, func) {
          if (typeof(func) == "function")
            func(ctx);
        });
      });

      // Notices

      eaui.notices.init();

      // Tilts

      ctx.lookup(".tilt").tilt();

      // Automatic context highlighting

      ctx.lookup("[data-ref]").each(function() {
        var selector = $(this).attr("data-ref");
        $(selector).addClass("active");
      });

      // Togglers

      ctx.lookup(".toggler").toggler();

      // Switchers

      ctx.lookup("[data-switch]").each(function() {
        var $switcher = $(this);
        var target = $switcher.attr("data-switch");
        var mode = $switcher.attr("data-switch-mode");
        $switcher.switcher({ target: target, mode: mode });
      });

      // Shows and hides

      ctx.lookup("[data-show]")
          .bind("click.eaui", function() {
            var e = $(this);
            $(e.attr("data-show")).show();
          });

      ctx.lookup("[data-hide]")
          .bind("click.eaui", function() {
            var e = $(this);
            $(e.attr("data-hide")).hide();
          });

      // Checkbox-based toggles

      ctx.lookup("input[data-toggle]").each(function() {
        var input = $(this);
        var selector = input.attr("data-toggle");

        function _update() {
          if (input.is(":checked")) $(selector).show();
          else $(selector).hide();
        }

        input.bind("change.eaui.toggle", _update);
        _update();
      });

      // Field autocomplete

      ctx.lookup("input[data-autocomplete]").fieldAutocomplete();

      // Select2

      if (typeof($.fn.select2) != "undefined") {
        $(".select2").each(function() {
          var e = $(this);
          if (e.hasClass("s2-initialized")) return;
          e.addClass("s2-initialized");
          e.select2({
            containerCssClass: e.attr("data-container-class"),
            containerCss: function() {
              var d = e.data("select2-container-css");
              if (d) return d;
              else return {};
            },
            dropdownCssClass: e.attr("data-dropdown-class"),
            dropdownCss: function() {
              var d = e.data("select2-dropdown-css");
              if (d) return d;
              else return {};
            },
            formatNoMatches: function() {
              return msg['select2.NoMatches'];
            },
            formatSearching: function() {
              return msg['select2.Searching'];
            },
            formatInputTooShort: function() {
              return msg['select2.InputTooShort'];
            },
            formatSelectionTooBig: function() {
              return msg['select2.SelectionTooBig'];
            },
            formatLoadMore: function() {
              return msg['select2.LoadMore'];
            },
            formatResult: function(state) {
              var beginning = "";
              if (state.element) {
                var e = $(state.element[0]);
                var title = e.attr("data-title");
                if (title)
                  beginning = title + ": "
              }
              return beginning + state.text;
            },
            matcher: function(term, text, option) {
              term = term.toLowerCase();
              if(text.toLowerCase().indexOf(term) >= 0)
                return true;
              if (option) {
                var title = option.attr("data-title");
                if (title && title.toLowerCase().indexOf(term) >= 0)
                  return true;
              }
              return false;
            }
          });
        });
      }

      // Date input

      ctx.lookup("input[type=date]").each(function() {
        var input = $(this);
        var id = input.attr("id");
        var inline = input.hasClass("inline");
        var handleClass = input.attr("data-handle-class");
        if (!handleClass)
          handleClass = "cal-icon";
        var newInput = input.dateinput({
          selectors: true,
          firstDay: parseInt(msg['cal.firstDayOfWeek']) - 1,
          format: 'yyyy-mm-dd',
          onShow: function() {
            // Who the fuck does that positioning inline?
            var cal = $("#calroot");
            // Sigh. Okay, let's fix it.
            cal.attr("style", "");
            var handle = $(".handle.cal-handle[for=" + id + "]");
            handle.replaceWith(cal).remove();
            // Attach inline class to prettify positioning
            if (inline) cal.addClass("inline");
          },
          onHide: function() {
            updateHandle();
          }
        });

        newInput.bind("change.eaui.dateinput", function() {
          updateHandle();
        });
        updateHandle();

        function updateHandle() {
          $(".handle.cal-handle[for=" + id + "]").remove();
          var handle = $('<label class="handle cal-handle"/>');
          handle.addClass(handleClass);
          handle.attr("for", newInput.attr("id"));
          var api = newInput.data("dateinput");
          var day = api.getValue('d');
          var year = "'" + api.getValue('yy');
          var m = parseInt(api.getValue('m') - 1);
          var month = msg['cal.month.' + m +'.short'];
          handle.empty();
          handle.append('<span class="day">' + day + '</span>');
          var my = $('<span class="month-year"/>');
          my.append('<span class="month">' + month + '</span>');
          my.append('<span class="year">' + year + '</span>');
          handle.append(my);
          newInput.after(handle);
        }

      });

      // Readonly forms

      ctx.lookup("form.readonly").each(function() {
        var $form = $(this);
        $("input, select, textarea", $form).attr("readonly", "readonly");
        $("input[type='checkbox'], input[type='radio']", $form)
            .attr("disabled", "disabled");
        $(".submits", $form).hide();
      });

      // Focus on form fields

      ctx.lookup("form .focus").focus();

      // Instant submission for inputs

      ctx.lookup("form .instant-edit").each(function() {
        var $field = $(this);
        var $form = $field.parents("form");
        if ($form.size() <= 0)
          return;
        var $input = $field.is(":input") ? $field : $(":input", $field);
        // Submit on change
        $input.bind("change.eaui.instantEdit", function() {
          $form.submit();
        });
      });

      // Reset and submit link inside forms

      ctx.lookup("form .reset").bind("click.eaui.reset", function(ev) {
        ev.preventDefault();
        var form = $(this).parents("form");
        var inputs = $(":input:not([type=submit])", form);
        inputs.val("");
        inputs.removeAttr("checked");
        $("option:first-child", inputs).attr("selected", "selected");
        $(this).parents("form")[0].reset();
        inputs.trigger("change");
      });

      ctx.lookup("form .submit").bind("click.eaui.submit", function(ev) {
        ev.preventDefault();
        var a = $(this);
        var form = a.parents("form");
        var name = a.attr("data-name");
        var value = a.attr("data-value");
        var params = [];
        if (name) {
          params.push({
            name: name,
            value: value
          });
        }
        form.trigger("submit", { params: params });
      });

      // Partial forms

      ctx.lookup("form.partial").partial();

      // Forms with local storage

      ctx.lookup(":input.localstore").localStore();

      // Popup link (colorbox)

      ctx.lookup('a[rel="popup"]').bind("click.eaui.popup", function(ev) {
        var a = $(this);
        a.ibox();
        ev.preventDefault();
        return false;
      });

      // Rich links

      ctx.lookup('.rich-links').each(function() {
        var cnt = $(this);

        // Externalize links

        $('a:not([target])', cnt).each(function() {
          var a = $(this);
          var href = a.attr("href");
          if (!href) return;
          var o = eaui.origin();
          if ((href.indexOf("http://") == 0 || href.indexOf("https://") == 0) &&
              href.indexOf(o) != 0) {
            a.attr("target", "_blank");
          }
        });

        // Class-links (start with `.`, point to next element with specified class,
        // inside the container; if no such element encountered, follow nowhere).

        $('a[href^="."]', cnt).each(function() {
          var a = $(this);
          var href = a.attr("href");
          var target = $(href, cnt).first();
          if (target.size() > 0) {
            // Assign random id, if it does not exist
            var id = target.attr("id");
            if (!id) {
              id = "ea-elem-" + Math.round(65535 * Math.random()).toString();
            }
            target.attr("id", id);
            a.attr("href", "#" + id);
          } else {
            a.attr("href", "javascript:;");
          }
        });

      });

      // Close ibox

      ctx.lookup('.close').bind("click.eaui.close", function() {
        eaui.ibox.close();
      });

      // Search forms (with partial results)

      ctx.lookup("*[data-search-container]").searchForm();

      // Set focus on click

      ctx.lookup("*[data-set-focus]").bind("click.eaui.focus", function() {
        var $this = $(this);
        $($this.attr("data-set-focus")).focus();
      });

      // Enrich textareas inside forms

      ctx.lookup("form textarea").bind("keydown.eaui", function(ev) {
        // Submit with Meta+Enter or Ctrl+Enter
        if ((ev.ctrlKey || ev.metaKey) &&
            ((ev.keyCode == 0xA) || (ev.keyCode == 0xD))) {
          var textarea = $(this);
          var form = textarea.parents("form");
          form.submit();
          ev.preventDefault();
        }
        // In(de)crease indent with (shift+)tab
        if (ev.keyCode == 0x9 && typeof(this.selectionStart) != "undefined") {
          var selStart = this.selectionStart;
          var selEnd = this.selectionEnd;
          var scrollTop = this.scrollTop;
          // Scroll selection start to the start of the line
          var start = selStart;
          while (start > 1 && this.value[start - 1] != "\n")
            start -= 1;
          var oldChunk = this.value.substring(start, selEnd);
          var newChunk = "";
          // Increase or decrease?
          if (ev.shiftKey) {
            var leadingSpaces = 0;
            if (oldChunk.indexOf(" ") == 0)
              leadingSpaces = 1;
            if (oldChunk.indexOf("  ") == 0)
              leadingSpaces = 2;
            newChunk = oldChunk.replace(/^ {0,2}/gm, "");
            // Replace the value
            this.value = this.value.substring(0, start) +
                newChunk +
                this.value.substring(selEnd);
            // Recalculate selection indices
            selStart -= leadingSpaces;
            selEnd += newChunk.length - oldChunk.length;
          } else {
            newChunk = oldChunk.replace(/^/gm, "  ");
            // Replace the value
            this.value = this.value.substring(0, start) +
                newChunk +
                this.value.substring(selEnd);
            // Recalculate selection indices
            selStart += 2;
            selEnd += newChunk.length - oldChunk.length;
          }
          this.selectionStart = selStart;
          this.selectionEnd = selEnd;
          this.scrollTop = scrollTop;
          ev.preventDefault();
        }
      });

      // Autoresizable textareas

      ctx.lookup("textarea.auto-resize").autoResize();

      // Sortable

      ctx.lookup(".sortable").each(function() {
        var $this = $(this);
        var settings = { };
        var placeholder = $this.attr("data-sort-placeholder");
        if (placeholder) settings.placeholder = placeholder;
        var items = $this.attr("data-sort-items");
        if (items) settings.items = items;
        var handle = $this.attr("data-sort-handle");
        if (handle) settings.handle = handle;
        $this.sortable(settings);
      });

      // Prompt for leaving forms changes

      ctx.lookup("form.unload-warn").each(function() {
        var form = $(this);
        updateInitialState();
        form.bind("submit.eaui.unload-warn", updateInitialState);

        function updateInitialState() {
          var data = $(":not(.exclude)", form).serialize();
          form.data("initial-state", data);
        }

        // Each .field-area receives autosave stuff

        if (window.localStorage)
          $(".field-area", this).each(function() {
            var area = $(this);
            // Acquire textarea
            var textarea = $("textarea", area);
            if (textarea.size() == 0)
              return;
            // Id attribute on textarea is mandatory
            var id = textarea.attr("id");
            if (!id)
              return;
            // Save server value on textarea element
            textarea[0].__originalValue = textarea.val();
            // Key combines current URL with textarea's ID
            var key = $.sha256(location.href.replace(/\?.*/g, "")) + ":" + id;
            // Init stashed value
            var stashed = window.localStorage.getItem(key);
            if (stashed) {
              textarea.val(stashed);
              updateMark();
            }
            // Values get updated on every keystroke
            area.unbind(".autosave")
                .bind("keyup.eaui.autosave", function() {
                  var value = textarea.val();
                  if (value == getOriginalValue())
                    localStorage.removeItem(key);
                  else
                    localStorage.setItem(key, value);
                  updateMark();
                });
            // Stashed value should be clean on postSubmit
            form.bind("postSubmit.autosave.eaui", function() {
              window.localStorage.removeItem(key);
              textarea[0].__originalValue = textarea.val();
              updateMark();
            });

            function getOriginalValue() {
              return textarea[0].__originalValue;
            }

            function isDirty() {
              return textarea[0].__dirty == true;
            }

            function markDirty() {
              if (isDirty()) return;
              var warningBlock = $('<div class="dirty"></div>');
              warningBlock.text(msg['changes.dirty']);
              var revertLink = $('<a href="javascript:;" class="revert"></a>');
              revertLink.attr("title", msg['changes.revert']);
              revertLink.bind("click.autosave.eaui", revert);
              warningBlock.append(revertLink);
              area.append(warningBlock);
              textarea[0].__dirty = true;
            }

            function markClean() {
              if (!isDirty()) return;
              $(".dirty", area).remove();
              textarea[0].__dirty = false;
            }

            function updateMark() {
              if (getOriginalValue() == textarea.val())
                markClean();
              else markDirty();
            }

            function revert() {
              textarea.val(getOriginalValue());
              window.localStorage.removeItem(key);
              markClean();
            }

          });

      });

      $(window).unbind("beforeunload.eaui")
          .bind("beforeunload.eaui.unload-warn", function() {
            var changedForms = $("form.unload-warn").filter(function() {
              var f = $(this);
              var currentState = $(":not(.exclude)", f).serialize();
              var initialState = f.data("initial-state");
              return currentState != initialState;
            });
            if (changedForms.size() > 0) return msg["unload.warn"];
          });

      $(window).unbind("viewportUnload.eaui")
          .bind("viewportUnload.eaui.unload-warn", function(ev) {
            var changedForms = $("form.unload-warn").filter(function() {
              var f = $(this);
              var currentState = $(":not(.exclude)", f).serialize();
              var initialState = f.data("initial-state");
              return currentState != initialState;
            });
            if (changedForms.size() > 0) {
              if (!confirm(msg['viewportUnload.warn']))
                ev.preventDefault();
            }
          });

      // Activities

      ctx.lookup("form.ea-task").each(function() {
        var form = $(this);
        var saveStateUrl = form.attr("data-save-state-url");
        $(":input", form).bind("change.eaui.activity", doSaveState);
        $(".sortable", form).bind("sortupdate.eaui.activity", doSaveState);
        function doSaveState() {
          var params = form.serializeArray();
          params.push({
            name: "__",
            value: new Date().getTime().toString()
          });
          $.ajax({
            url: saveStateUrl,
            type: "post",
            data: params,
            error: eaui.processAjaxError
          });
        }
      });

      // Hints

      ctx.lookup(".hint").hint();

      // File upload support

      ctx.lookup("iframe.file-uploader").each(function() {
        var iframe = $(this);
        var uuid = iframe.attr("data-uuid");
        var field = $("#filename-" + uuid);
        iframe.bind("load.eaui.fileUploader", function() {
          var ctx = iframe.contents();
          field.val("");
          var filename = $("#filename-" + uuid, ctx);
          if (filename.size() > 0) {
            field.val(filename.val());
          }
        });
      });

      // Image thumbs

      ctx.lookup("img[data-src]").each(function() {
        var img = $(this);
        var src = img.attr("data-src");
        if (src) {
          img.unbind(".gallery")
              .bind("click.eaui.gallery", function(ev) {
                var wrapper = $('<div style="text-align:center"/>');
                var _image = $('<img src="' + src + '"/>');
                wrapper.append(_image);
                eaui.ibox.show(wrapper);
              });
        }
      });

      // Automatic partial load blocks

      ctx.lookup("[data-load]").each(function() {

        var block = $(this);
        var url = block.attr("data-load");

        function loadInViewport() {
          if (!block)
            return;
          var viewBottom = $(window).scrollTop() + $(window).height();
          if (block.offset().top < viewBottom) {
            var ph = eaui.placeholder();
            var classes = block.attr("class");
            var styles = block.attr("style");
            block.replaceWith(ph).remove();
            block = null;
            $.ajax({
              dataType: "html",
              url: url,
              data: {"__" : new Date().getTime().toString()},
              type: "get",
              success: function(data) {
                eaui.log("Loaded " + url);
                var content = $("<div/>");
                content.attr("data-loaded", url);
                content.attr("class", classes);
                content.attr("style", styles);
                content.append(data);
                ph.replaceWith(content).remove();
                eaui.init(content);
              },
              error: function(xhr) {
                eaui.log("Failed to load " + url);
                ph.remove();
              }
            });
          }
        }

        $(window).bind("scroll.eaui", loadInViewport);
        $(document).bind("ea-load.eaui", loadInViewport);

      });

      // MathJax

      if (typeof(MathJax) != "undefined")
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, ctx[0]]);

      // Highlighting

      if (typeof(hljs) != "undefined")
        ctx.lookup("pre").each(function() {
          var pre = $(this);
          if (pre.hasClass("hl"))
            hljs.highlightBlock(this);
        });

      // Grab link tags from ctx and insert them into head

      ctx.lookup("link").each(function() {
        var lnk = $(this);
        var href = lnk.attr("href");
        var existing = $("head link[href='" + href + "']");
        if (existing.size() == 0)
          $("head").append(lnk);
        else lnk.remove();
      });

      // Trigger initialization event

      $(document).trigger("ea-load", { ctx: ctx });

      // Bind history-related events for viewport handling

      if (!window.__eaHistoryInitialized) {

        window.__eaHistoryInitialized = true;

        if (typeof(history.replaceState) == "function") {
          var href = location.href;

          history.replaceState({"href": href}, null, href);

          window.onpopstate = function(ev) {
            var state = ev.state;
            if (state && state.href) {
              eaui.loadViewport(state.href);
            }
          };

        }

      }

      // Create keepalive timers

      if (!window.__eaKeepaliveInitialized) {
        window.__eaKeepaliveInitialized = true;
        var url = $("body").attr("data-keepalive-url");
        if (url) {
          setInterval(function() {
            $.get(url, {"__": new Date().getTime().toString()});
          }, 4 * 60 * 1000); // 4 mins
        }
      }

    }
  };

  // Custom initialization

  (function() {

    // Date input localization

    if (typeof(msg) == "undefined")
      return;

    var i = 0;
    var months = "";
    var shortMonths = "";
    var days = "";
    var shortDays = "";

    for (i = 0; i < 12; i++) {
      months += msg["cal.month." + i];
      shortMonths += msg["cal.month." + i + ".short"];
      if (i != 11) {
        months += ",";
        shortMonths += ",";
      }
    }

    for (i = 1; i <= 7; i++) {
      days += msg["cal.weekdays." + i];
      shortDays += msg["cal.weekdays." + i + ".short"];
      if (i != 7) {
        days += ",";
        shortDays += ",";
      }
    }

    if (typeof($.tools) != "undefined")
      try {
        $.tools.dateinput.localize("en", {
          months: months,
          shortMonths: shortMonths,
          days: days,
          shortDays: shortDays
        });
      } catch (e) {
        eaui.log("Could not localize dateinput.");
      }

    // Highcharts localization

    if (typeof(Highcharts) != "undefined")
      Highcharts.setOptions({
        global: {
          useUTC: false
        },
        lang: {
          resetZoom: msg['chart.resetZoom']
        }
      });

  })();

  // SHA256
  (function(f){var m=8;var k=function(q,t){var s=(q&65535)+(t&65535);var r=(q>>16)+(t>>16)+(s>>16);return(r<<16)|(s&65535)};var e=function(r,q){return(r>>>q)|(r<<(32-q))};var g=function(r,q){return(r>>>q)};var a=function(q,s,r){return((q&s)^((~q)&r))};var d=function(q,s,r){return((q&s)^(q&r)^(s&r))};var h=function(q){return(e(q,2)^e(q,13)^e(q,22))};var b=function(q){return(e(q,6)^e(q,11)^e(q,25))};var p=function(q){return(e(q,7)^e(q,18)^g(q,3))};var l=function(q){return(e(q,17)^e(q,19)^g(q,10))};var c=function(r,s){var E=new Array(1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298);var t=new Array(1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225);var q=new Array(64);var G,F,D,C,A,y,x,w,v,u;var B,z;r[s>>5]|=128<<(24-s%32);r[((s+64>>9)<<4)+15]=s;for(var v=0;v<r.length;v+=16){G=t[0];F=t[1];D=t[2];C=t[3];A=t[4];y=t[5];x=t[6];w=t[7];for(var u=0;u<64;u++){if(u<16){q[u]=r[u+v]}else{q[u]=k(k(k(l(q[u-2]),q[u-7]),p(q[u-15])),q[u-16])}B=k(k(k(k(w,b(A)),a(A,y,x)),E[u]),q[u]);z=k(h(G),d(G,F,D));w=x;x=y;y=A;A=k(C,B);C=D;D=F;F=G;G=k(B,z)}t[0]=k(G,t[0]);t[1]=k(F,t[1]);t[2]=k(D,t[2]);t[3]=k(C,t[3]);t[4]=k(A,t[4]);t[5]=k(y,t[5]);t[6]=k(x,t[6]);t[7]=k(w,t[7])}return t};var j=function(t){var s=Array();var q=(1<<m)-1;for(var r=0;r<t.length*m;r+=m){s[r>>5]|=(t.charCodeAt(r/m)&q)<<(24-r%32)}return s};var n=function(s){var r="0123456789abcdef";var t="";for(var q=0;q<s.length*4;q++){t+=r.charAt((s[q>>2]>>((3-q%4)*8+4))&15)+r.charAt((s[q>>2]>>((3-q%4)*8))&15)}return t};var o=function(s,v){var u=j(s);if(u.length>16){u=core_sha1(u,s.length*m)}var q=Array(16),t=Array(16);for(var r=0;r<16;r++){q[r]=u[r]^909522486;t[r]=u[r]^1549556828}var w=c(q.concat(j(v)),512+v.length*m);return c(t.concat(w),512+256)};var i=function(q){q=typeof q=="object"?f(q).val():q.toString();return q};f.extend({sha256:function(q){q=i(q);return n(c(j(q),q.length*m))},sha256hmac:function(q,r){q=i(q);r=i(r);return n(o(q,r))},sha256config:function(q){m=parseInt(q)||8}});f.fn.sha256=function(r){f.sha256config(r);var q=i(f(this).val());var s=f.sha256(q);f.sha256config(8);return s}})(jQuery);

})(jQuery);
