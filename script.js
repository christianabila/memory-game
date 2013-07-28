$(function() {
  var State, Tiles, Clicks, Score, Timer, Level;
  load_game();

  // return window.Game = {state: State, tiles: Tiles,
  //   clicks: Clicks, score: Score, timer: Timer, view: View, level: Level};

  function load_game() {
    load_window();
    load_level();
    load_i18n();
    load_tiles();
    load_state();
    load_clicks();
    load_timer();
    load_score();
  }
  function load_window() {
    resize();
    $(window).resize(resize);
    function resize() {
      var w = $(window).width(), h = $(window).height(), size, r = 4 / 5;
      w > h ? set_wide_size() : set_narrow_size();
      set_font_size();
      function set_wide_size() {
        size = Math.min(w * r, h) * .99;
        $('#window').css({
          'width': size / r, 'height': size,
          'margin-top': (h - size) / 2
        });
        $('#window').removeClass('narrow');
        $('#window').addClass('wide');
      }
      function set_narrow_size() {
        size = Math.min(w, h * r) * .99;
        $('#window').css({
          'width': size, 'height': size / r,
          'margin-top': (h - size / r) / 2
        });
        $('#window').removeClass('wide');
        $('#window').addClass('narrow');
      }
      function set_font_size() {
        var font_size = Math.floor(size / 5) + '%';
        $('body').css('font-size', font_size);
        $('body').css('line-height', $('body').css('font-size'));
      }
    }
  }
  function load_state() {
    var gameover = true;
    State = {gameover: is_over, End: load_end(),
      start_game: start_game, reset_game: reset_game, display: display};
    repaint();

    $('#reset-game').click(reset_game);
    function reset_game() {
      Tiles.reset();
      Tiles.disable();
      Clicks.reset();
      Score.reset();
      Timer.reset();
      repaint();
    }
    function start_game() {
      gameover = false;
      Tiles.reset();
      Clicks.reset();
      Score.reset();
      Timer.start();
      repaint();
    }
    function is_over() {
      return gameover;
    }
    function display() {
      $('#reset-game').toggleClass('invisible', !(gameover && Tiles.match_count()));
      $('#end-game').toggleClass('invisible', gameover);
    }
    function repaint() {
      Level.display();
      State.display();
      Tiles.display();
    }

    function load_end() {
      $('#end-game').click(bored);

      return {win: win, time_is_up: time_is_up,
        too_much_clicks: too_much_clicks, bored: bored};

      function win() {
        end_game('you-win');
      }
      function time_is_up() {
        end_game('time-is-up');
      }
      function too_much_clicks() {
        end_game('too-much-clicks');
      }
      function bored() {
        if (!Tiles.match_count() || window.confirm(i18n.t('are-you-sure')))
          end_game();
      }
      function end_game(message) {
        if (gameover) return;
        gameover = true;
        Timer.stop();
        if (arguments.length)
          alert(i18n.t(message, {sprintf: [Score.value()]}));
        repaint();
      }
    }
  }
  function load_level() {
    var level = 4;
    $('#level-up').click(next);

    Level = {display: display, next: next, value: get};

    function next() {
      level = (level - 2) % 6 + 3; // 4 -> 5 -> 6 -> 7 -> 8 -> 3 -> 4
      State.reset_game();
    }
    function get() {
      return level;
    }
    function display() {
      $('#level-up').toggleClass('invisible', !(State.gameover() && !Tiles.match_count()));
      $('#level').text(level + ' x ' + level);
      var klass = level > 5 ? 'icon-th' : 'icon-th-large';
      $('#level-up i').removeClass().addClass(klass);
    }
  }
  function load_i18n() {
    set_language();
    $('#language').click(set_language);
    function set_language() {
      var lng = i18n.lng() === 'en' ? 'tr' : 'en';
      var options = {lng: lng, fallbackLng: 'en', postProcess: 'sprintf'};
      i18n.init(options, function() {
        $('body').i18n();
      });
    }
  }
  function load_timer() {
    var interval = null, time = 0, max_time = 0;
    Timer = {start: start, stop: stop, reset: reset};
    var ProgressBar = load_progress_bar();
    reset();

    function start() {
      reset();
      interval = setInterval(function() {
        set_time(time + 1);
        if (time >= max_time)
          State.End.time_is_up();
      }, 1000);
    }
    function stop() {
      clearInterval(interval);
    }
    function reset() {
      stop();
      max_time = Tiles.count() * 4;
      set_time(0);
    }
    function set_time(t) {
      time = t;
      display();
    }
    function display() {
      $('#seconds-left').text(max_time - time);
      ProgressBar.update();
    }

    function load_progress_bar() {
      var $bar = $('#seconds-left').siblings('.progress-bar');
      return {update: update};
      function update() {
        $bar.css('left', time * 100 / max_time + '%');
      }
    }
  }
  function load_clicks() {
    var count = 0, max_count = 0, $tiles = $('#tiles'), tile_to_match;
    Clicks = {reset: reset, value: get};
    var ProgressBar = load_progress_bar();
    reset();

    $tiles.on('click', '.tile', function() {
      click(this.tile);
    });
    function get() {
      return count;
    }
    function set(n) {
      count = n;
      display();
    }
    function reset() {
      set(0);
      max_count = Math.round(Math.pow(Level.value(), 2.5));
    }
    function click(tile) {
      if (tile.visible) return;
      if (!State.gameover()) click_to_continue();
      else if (!Tiles.match_count()) click_to_start();

      function click_to_start() {
        var index = tile.$div.index();
        State.start_game();
        $($('.tile').get(index)).trigger('click');
      }
      function click_to_continue() {
        set(count + 1);
        count % 2 === 1 ? first_click() : second_click();
        if (count >= max_count) State.End.too_much_clicks();
      }
      function first_click() {
        hide();
        tile.show();
        tile_to_match = tile;
      }
      function second_click() {
        tile.show();
        if (tile.id === tile_to_match.id)
          Tiles.match(tile_to_match, tile);
        else
          hide(tile_to_match, tile);
      }
      function hide(first_tile, second_tile) {
        var timeout;
        if (arguments.length) {
          $tiles.on('hide', function() {
            first_tile.display();
            second_tile.display();
            clearTimeout(timeout);
            $tiles.off('hide');
          });
          timeout = setTimeout(hide, 300);
        }
        else {
          $tiles.trigger('hide');
        }
      }
    }
    function display() {
      $('#clicks').text(count);
      ProgressBar.update();
    }

    function load_progress_bar() {
      var $bar = $('#clicks').siblings('.progress-bar');
      return {update: update};
      function update() {
        $bar.css('left', count * 100 / max_count + '%');
      }
    }
  }
  function load_tiles() {
    var Tile = defineTileClass();
    var tiles, $tiles = $('#tiles'), count, matches = 0;
    Tiles = {match: match, match_count: match_count,
      reset: reset, count: get_count, disable: disable, display: display};

    reset();

    function match_count() {
      return matches;
    }
    function match(tile1, tile2) {
      matches++;
      Score.update();
      tile1.matched = tile2.matched = true;
      if (matches === count / 2)
        State.End.win();
    }
    function reset() {
      var level = Level.value();
      count = Math.pow(level, 2) - (level % 2);
      matches = 0;

      tiles = [];
      $tiles.empty();
      for (var i = 0; i < count; i++) {
        tiles[i] = new Tile(i % (count / 2));
        tiles[i].$div.appendTo($tiles);
      }
      shuffle();

      var tile_size = (100 / level - .4) + '%';
      $('.tile').css({'width': tile_size, 'height': tile_size});
    }
    function shuffle() {
      for (var i = 0; i < count; i++) {
        var $tile1 = $('.tile').eq(i);
        var $tile2 = $('.tile').eq(Math.floor(Math.random() * count));
        $tile1.after($tile2);
      }
    }
    function get_count() {
      return count;
    }
    function display() {
      for (var i = 0; i < tiles.length; i++)
        tiles[i].display();
    }
    function disable() {
      for (var i = 0; i < tiles.length; i++)
        tiles[i].disable();
    }

    function defineTileClass() {
      var Tile = function(id) {
        this.init(id);
      };

      Tile.prototype = {
        init: function(id) {
          this.id = id;
          this.$div = $('<div/>', {class: 'tile'});
          this.$image = $('<img/>').appendTo(this.$div);
          this.$div.get()[0].tile = this;
          this.$image.attr('src', 'images/' + (id + 1) + '.png');
          this.reset();
        },
        reset: function() {
          this.matched = false;
          this.hide();
          this.enable();
        },
        show: function() {
          this.$image.show();
          this.visible = true;
          this.$div.addClass('visible');
          this.disable();
        },
        hide: function() {
          this.$image.hide();
          this.visible = false;
          this.$div.removeClass('visible');
          this.enable();
        },
        display: function() {
          this.matched ? this.show() : this.hide();
          if (State.gameover()) this.disable();
        },
        enable: function() {
          this.enabled = true;
          this.$div.addClass('enabled');
        },
        disable: function() {
          this.enabled = false;
          this.$div.removeClass('enabled');
        }
      };

      return Tile;
    }
  }
  function load_score() {
    var last_match_time, last_match_clicks, score;
    Score = {reset: reset, update: update, value: get};
    var ProgressBar = load_progress_bar();
    reset();

    function reset() {
      last_match_time = now();
      last_match_clicks = 0;
      set(0);
    }
    function update() {
      var time = now() - last_match_time;
      var clicks = Clicks.value() - last_match_clicks;
      add(Tiles.count() * 20000 / (time + 1) / (clicks + 1));
      last_match_time = now();
      last_match_clicks = Clicks.value();
    }
    function now() {
      return +new Date;
    }
    function add(n) {
      set(score + n);
    }
    function set(n) {
      score = n;
      display();
    }
    function get() {
      return Math.round(score);
    }
    function display() {
      $('#score').text(get());
      ProgressBar.update();
    }

    function load_progress_bar() {
      var $bar = $('#score').siblings('.progress-bar');
      return {update: update};
      function update() {
        var pairs = Tiles.count() / 2;
        var percentage = Tiles.match_count() * 100 / pairs;
        $bar.css({right: 100 - percentage + '%'});
      }
    }
  }
});
