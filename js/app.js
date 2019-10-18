function wp_action  (data, svg_area, silent) {
console.log("wp_action data = "+data);

    var silent = silent || false;
    if (!silent) {
        total_edits += 1;
    }
  //  if (total_edits == 1) {
    //    $('#edit_counter').html('You have seen <span>' + total_edits + ' events</span>.');
  //  } else {
        $('#edit_counter').html('You have seen a total of <span>' + insert_comma(total_edits) + ' events</span>.');
        update_epm(total_edits, svg_area);
  //  }
    var now = new Date();
    edit_times.push(now);
    to_save = [];
    if (edit_times.length > 1) {
        for (var i = 0; i < edit_times.length + 1; i ++) {
            var i_time = edit_times[i];
            if (i_time) {
                var i_time_diff = now.getTime() - i_time.getTime();
                if (i_time_diff < 60000) {
                    to_save.push(edit_times[i]);
                }
            }
        }
        edit_times = to_save;
        var opacity = 1 / (100 / to_save.length);
        if (opacity > 0.5) {
            opacity = 0.5;
        }
        /*rate_bg.attr('opacity', opacity)*/
      ///total_edits  update_epm(to_save.length, svg_area);

    }

    var size = data.value;
    var label_text = data.event + " is "+data.value;
    var csize = data.diffvalue  ;
    var no_label = false;
    var type;
        type = 'user';

    if (data.event == "motion" || data.event == "jc" || data.event == "relativeHumidity" ) {
        type = 'bot';
    } else if (data.event == "temperatureK" || data.event == "volatileOrganicCompound" )  {
        type = 'user';
    } else {
        type = 'anon';
    }




    var circle_id = 'd' + ((Math.random() * 100000) | 0);
    var abs_size = Math.abs(data.value);
    size = Math.max(Math.sqrt(abs_size) * scale_factor, 4);

  //  Math.seedrandom(data.event)
    if(data.diffvalue > 2000 ||data.diffvalue  <1 )
      data.diffvalue =  Math.random(2000)
    var x = Math.random() * (width - data.diffvalue) + size;
    var y = Math.random() * (height - data.random) + size;
    if (!silent) {
        if (data.random > 50) {
          play_sound(size, 'add', 1);
        } else {
            play_sound(size, 'sub', 1);
        }
      }

    if (data.random < 50) {
        var starting_opacity = 0.5;
    } else {
        var starting_opacity = 1;
    }


if (data.event != "ThermImg")
//return
//edit_color = "#888"
        console.log( data.event+" ="+x+" y="+y+" color ="+edit_color +" data.diffvalue ="+data.diffvalue+" data.random= "+data.random+" abs_size="+abs_size);
if (data.event == "ThermImg")
{
  starting_opacity = .4;
  edit_color = "#555";
}
    if (data.event == "jc") {
      console.log( "before wp_action - jc - x ="+x+" y="+y+" color ="+edit_color);
      if (x >1024 && x>0)
          x = 2000 - x;
      else
            x =500+x;

      if (y <900 && y>0)
          y = y - 500;
      else {
          y = 200;
      }

      data.event = "We switched Something on";
      label_text =   data.event
      starting_opacity = .8;
      edit_color = "#FF0";
          console.log( "after wp_action - jc - x ="+x+" y="+y+" color ="+edit_color);
    }//jc

    var circle_group = svg_area.append('g')
        .attr('transform', 'translate(' + x + ', ' + y + ')')
        .attr('fill', edit_color)
        .style('opacity', starting_opacity)

    var ring = circle_group.append('circle')
         .attr({r: size + 20,
                stroke: 'none'})
         .transition()
         .attr('r', size + 40)
         .style('opacity', 0)
         .ease(Math.sqrt)
         .duration(2500)
         .remove();

    var circle_container = circle_group.append('a')
        .attr('xlink:href', data.url)
        .attr('target', '_blank')
        .attr('fill', svg_text_color);

    var circle = circle_container.append('circle')
        .classed(type, true)
        .attr('r', size)
        .transition()
        .duration(max_life)
        .style('opacity', 0)
        .each('end', function() {
            circle_group.remove();
        })
        .remove();

    circle_container.on('mouseover', function() {
        if (no_label) {
            no_label = false;
            circle_container.append('text')
                .text(label_text)
                .classed('article-label', true)
                .attr('text-anchor', 'middle')
                .transition()
                .delay(1000)
                .style('opacity', 0)
                .duration(2000)
                .each('end', function() { no_label = true; })
                .remove();
        }

    });

    //if (data.random < 50) {
        var text = circle_container.append('text')
            .text(label_text)
            .classed('article-label', true)
            .attr('text-anchor', 'middle')
            .transition()
            .delay(1000)
            .style('opacity', 0)
            .duration(2000)
            .each('end', function() { no_label = true; })
            .remove();
  //  } else {
    //    no_label = true;
  // /  }
}


function wikipediaSocket() {

}

wikipediaSocket.init = function(ws_url, lid, svg_area) {
    this.connect = function() {
        $('#' + lid + '-status').html('(connecting...)');
        var loading = true;

        // Terminate previous connection, if any
        if (this.connection)
          this.connection.close();

        if ('WebSocket' in window) {
            var connection = new ReconnectingWebSocket(ws_url);
            this.connection = connection;

            connection.onopen = function() {
                console.log('Connection open to ' + lid);
                $('#' + lid + '-status').html('(connected)');
            };

            connection.onclose = function() {
                console.log('Connection closed to ' + lid);
                $('#' + lid + '-status').html('(closed)');
            };

            connection.onerror = function(error) {
                $('#' + lid + '-status').html('Error');
                console.log('Connection Error to ' + lid + ': ' + error);
            };

            connection.onmessage = function(resp) {
                var data = JSON.parse(resp.data);
                //console.log("gotdata = "+resp.data);
                if (!all_loaded) {
                    return;
                }

                if (data.event != "twitter" && data.event !=  "Hello" && data.event !=  "jc") {
                    if (!isNaN(data.value) && (TAG_FILTERS.length == 0 || $(TAG_FILTERS).filter($.map(data.event, function(i) {
                        return i.toLowerCase();
                    })).length > 0)) {
                        if (TAG_FILTERS.length > 0) {
                            console.log('Filtering for: ' + TAG_FILTERS)
                        }
                        if (data.random > 50) {
                            data.revert = true;
                        } else {
                            data.revert = false;
                        }
                        var rc_str =  data.event + " "+data.value;

                        log_rc(rc_str, 20);

                    //
                        wp_action(data, svg_area,false);
                    } else if (!isNaN(data.value)) {
                          wp_action(data, svg_area, false);
                    }
                } else if (data.event == 'Hello') {
                  console.log("Hello>>>>>"+data);
                    wp_action(data, svg_area, true);
                }else if (data.event == 'jc') {
                  console.log("jc>>>>>"+data);
                  if (user_announcements) {
                      jc[2].play();
                      console.log("Play special sound>>>>>"+data);
                    //  newuser_action( data, lid, svg_area);
                  //  data.random
                  /*
                  var size = data.value;
                  var label_text = data.event ;//+ "\\n is "+data.value;
                  var csize = data.diffvalue  ;
                  var no_label = false;
                */
                  //data.value = 100;
                  data.diffvalue=266;
                  var rc_str = "Special Event " + data.value;

                  log_rc(rc_str, 20);

                    wp_action(data, svg_area, true);
                  }
                } else if (data.event == 'twitter') {
                  //console.log("tweets>>>>>"+data);
                    if (user_announcements) {
                       newuser_action(data, lid, svg_area);
                    }
                    var nu_str = '';//'<a href="http://' + lid + '.wikipedia.org/w/index.php?title=User_talk:' + data.user + '&action=edit&section=new">' + data.user + ' Markus1</a>';
                    nu_str += 'Tweets about IoT!'; //lid
                    log_rc(nu_str, 20);
                }
            };
        }
    };
    this.close = function() {
        if (this.connection) {
            this.connection.close();
        }
    };
};

wikipediaSocket.close = function() {
    if (this.connection) {
        this.connection.close();
    }
};

var log_rc = function(rc_str, limit) {
    $('#rc-log').prepend('<li>' + rc_str + '</li>');
    if (limit) {
        if ($('#rc-log li').length > limit) {
            $('#rc-log li').slice(limit, limit + 1).remove();
        }
    }
};
/*
var rate_bg = svg.append('rect')
    .attr('opacity', 0.0)
    .attr('fill', 'rgb(41, 128, 185)')
    .attr('width', width)
    .attr('height', height)
*/
function play_sound(size, type, volume) {
    var max_pitch = 100.0;
    var log_used = 1.0715307808111486871978099;
    var pitch = 100 - Math.min(max_pitch, Math.log(size + log_used) / Math.log(log_used));
    var index = Math.floor(pitch / 100.0 * Object.keys(celesta).length);
    var fuzz = Math.floor(Math.random() * 4) - 2;
    index += fuzz;
    index = Math.min(Object.keys(celesta).length - 1, index);
    index = Math.max(1, index);
    if (current_notes < note_overlap) {
        current_notes++;
        if (type == 'add') {
            celesta[index].play();
        } else {
            clav[index].play();
        }
        setTimeout(function() {
            current_notes--;
        }, note_timeout);
    }
}



function play_random_swell() {
    var index = Math.round(Math.random() * (swells.length - 1));
    swells[index].play();
}

function newuser_action(data, lid, svg_area) {
    //play_random_swell();

    if ( data.location == null)
      data.location =  data.user ;

    var messages = [data.user + ' tweeted: '+data.text ,
                    '#WatsonIoT has a new tweet from , ' + data.user + '!',
                    '#WatsonIoT has a new tweet from , ' + data.location + '!',
                    'Yes, ' + data.user + ' has tweet #WatsonIoT !'];
    var message = Math.round(Math.random() * (messages.length - 1));
    var user_link = 'http://markusvankempen.wordpress.org';
    var user_group = svg_area.append('g');

    var user_container = user_group.append('a')
        .attr('xlink:href', user_link)
        .attr('target', '_blank');

    user_group.transition()
        .delay(7000)
        .remove();

    user_container.transition()
        .delay(4000)
        .style('opacity', 0)
        .duration(3000);

    user_container.append('rect')
        .attr('opacity', 0)
        .transition()
        .delay(100)
        .duration(3000)
        .attr('opacity', 1)
        .attr('fill', newuser_box_color)
        .attr('width', width)
        .attr('height', 35);

    var y = width / 2;

    user_container.append('text')
        .classed('newuser-label', true)
        .attr('transform', 'translate(' + y +', 25)')
        .transition()
        .delay(1500)
        .duration(1000)
        .text(messages[message])
        .attr('text-anchor', 'middle');

}

var return_hash_settings = function() {
    var hash_settings = window.location.hash.slice(1).split(',');
    for (var i = 0; i < hash_settings.length + 1; i ++) {
        if (hash_settings[i] === '') {
            hash_settings.splice(i, 1);
        }
    }
    return hash_settings;
};

var return_lang_settings = function() {
    var enabled_hash = return_hash_settings();
    enabled_langs = [];
    for (var i = 0; i < enabled_hash.length +1; i ++) {
        var setting = enabled_hash[i];
        if (langs[setting]) {
            enabled_langs.push(setting);
        }
    }
    return enabled_langs;
};

var set_hash_settings = function (langs) {
    if (langs[0] === '') {
        langs.splice(0, 1);
    }
    window.location.hash = '#' + langs.join(',');
};

var enable = function(setting) {
    var hash_settings = return_hash_settings();
    if (setting && hash_settings.indexOf(setting) < 0) {
        hash_settings.push(setting);
    }
    set_hash_settings(hash_settings);
};

var disable = function(setting) {
    var hash_settings = return_hash_settings();
    var setting_i = hash_settings.indexOf(setting);
    if (setting_i >= 0) {
        hash_settings.splice(setting_i, 1);
    }
    set_hash_settings(hash_settings);
};

window.onhashchange = function () {
    var hash_settings = return_hash_settings();
    for (var lang in SOCKETS) {
        if (hash_settings.indexOf(lang) >= 0) {
            if (!SOCKETS[lang].connection || SOCKETS[lang].connection.readyState == 3) {
                SOCKETS[lang].connect();
                $('#' + lang + '-enable').prop('checked', true);
            }
        } else {
            if ($('#' + lang + '-enable').is(':checked')) {
                $('#' + lang + '-enable').prop('checked', false);
            }
            if (SOCKETS[lang].connection) {
                SOCKETS[lang].close();
            }
        }
    }
    if (hash_settings.indexOf('notitles') >= 0) {
        s_titles = false;
    } else {
        s_titles = true;
    }
    if (hash_settings.indexOf('nowelcomes') >= 0) {
        s_welcome = false;
    } else {
        s_welcome = true;
    }
    set_hash_settings(hash_settings);
};

var make_click_handler = function($box, setting) {
    return function() {
            if ($box.is(':checked')) {
                enable(setting);
            } else {
                disable(setting);
            }
        };
};

var epm_text = false;
var epm_container = {};
var mystarttime = Date.now();

function update_epm(epm, svg_area) {

    var gotmessagetime = Date.now();

    var deltatime = ((gotmessagetime - mystarttime)/1000).toFixed(2);

    var evps = (epm/deltatime).toFixed(2);
    var evpm = (evps*60).toFixed(2);

    if (!epm_text) {
        epm_container = svg_area.append('g')
            .attr('transform', 'translate(0, ' + (height - 25) + ')');

        var epm_box = epm_container.append('rect')
            .attr('fill', newuser_box_color)
            .attr('opacity', 0.5)
            .attr('width', 450)
            .attr('height', 25);

        epm_text = epm_container.append('text')
            .classed('newuser-label', true)
            .attr('transform', 'translate(5, 18)')
            .style('font-size', '.8em')
            .text(epm + ' events - mvk@ca.ibm.com');

    } else if (epm_text.text) {
        epm_text.text("Events:" + epm + ' , Seconds:'+deltatime +" , e/sec="+evps+" , e/min="+evpm +" - mvk@ca.ibm.com")
    }
}

var tag_area = {},
    tag_text = false,
    tag_box = false;

function update_tag_warning(svg_area) {
    if (TAG_FILTERS.length == 0) {
        if (!$.isEmptyObject(tag_area)) {
            tag_area.remove();
            tag_area = {}, tag_text = false;
        }
        return
    }
    if (!tag_text) {
        tag_area = svg_area.append('g');
        tag_box = tag_area.append('rect')
            .attr('fill', newuser_box_color)
            .attr('opacity', 0.5)
            .attr('height', 25);
        tag_text = tag_area.append('text')
            .classed('newuser-label', true)
            .attr('transform', 'translate(5, 18)')
            .style('font-size', '.8em');
    }
    tag_area.attr('transform', 'translate(0, ' + (height - 50) + ')');
    tag_text.text('Listening to: #' + TAG_FILTERS.join(', #'));
    var tag_bbox = tag_text.node().getBBox();
    tag_box.attr('width', tag_bbox.width + 10);
    s_welcome = false;
}

var insert_comma = function(s) {
    s = s.toFixed(0);
    if (s.length > 2) {
        var l = s.length;
        var res = "" + s[0];
        for (var i=1; i<l-1; i++) {
            if ((l - i) % 3 == 0)
                res += ",";
            res +=s[i];
        }
        res +=s[l-1];

        res = res.replace(',.','.');

        return res;
    } else {
        return s;
    }
}
