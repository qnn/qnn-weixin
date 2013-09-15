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
            '</small></td><td>' + b[9].toFixed(6) + ', ' + b[10].toFixed(6) + '</td></tr>');
        });
        done(data.stores.length);
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
  }
});
