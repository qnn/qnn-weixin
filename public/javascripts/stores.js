$(function(){
  if ($('#stores_list_all').length==1) {
    var start = 0;
    var step = 30;
    var load = function(done) {
      $.getJSON('/api/stores', { count: step, start: start }, function(data){
        if (start == 0) $('#stores_list_all tbody').empty();
        $.each(data.stores, function(a, b){
          var name = '<a target="_blank" href="/stores/' + b[0] + '">' + b[0] + '</a>';
          $('#stores_list_all tbody').append('<tr><td>' + (start + a + 1) + '</td><td>' +
            name + '<br><small>' + b[1] + ', ' + b[2] + ', ' + b[3] + ', ' + b[4] +
            '</small></td><td><a href="#" class="coord">' + b[9].toFixed(6) + ', ' +
            b[10].toFixed(6) + '</a></td></tr>');
        });
        if (done) done(data.stores.length);
      });
    };
    load();
    $('#load_more').click(function(){
      $('#load_more').prop('disabled', true);
      start += step;
      load(function(count){
        $('#load_more').prop('disabled', false);
        if (count < step) {
          $('#stores_list_all tfoot').hide();
        }
      });
    });
    var map, marker;
    $(document).on('click', '.coord', function(e){
      e.preventDefault();
      var that = this;
      var tr = $(that).parents('tr');
      var coord = /^(.*),\s(.*)$/.exec($(that).text());
      var point = new BMap.Point(coord[2], coord[1]);
      if (map) {
        $('tr.maptr').insertAfter(tr);
        map.centerAndZoom(point, 14);
        marker.setPosition(point);
      } else {
        var mapdiv = $('<div />').height(300);
        $('<tr class="maptr" />').append($('<td colspan="3" />').append(mapdiv)).insertAfter(tr);

        map = new BMap.Map(mapdiv[0]);
        map.addControl(new BMap.NavigationControl());
        map.enableScrollWheelZoom();
        var icon_green = new BMap.Icon('/images/marker_green.png', new BMap.Size(20, 32), {
          anchor: new BMap.Size(10, 30),
          infoWindowAnchor: new BMap.Size(10, 0)
        });
        marker = new BMap.Marker(point, { icon: icon_green });
        marker.addEventListener('dragging', function(info){
          $(info.target.map.xa).parents('tr').prev().find('a.coord').text(info.point.lat + ', ' + info.point.lng);
        });
        marker.enableDragging();
        map.addOverlay(marker);
        map.centerAndZoom(point, 14);
      }
    });
  }
});
