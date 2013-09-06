$(function(){
  var get_my_coord_text = $('#get_my_coord').text();
  $('#get_my_coord').on('click', function(){
    $('#get_my_coord').text('获取中...').prop('disabled', true);
    var resume_button = function() { $('#get_my_coord').text(get_my_coord_text).prop('disabled', false); }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position){
        resume_button();
        $('#coord-lat').val(position.coords.latitude);
        $('#coord-lng').val(position.coords.longitude);
      }, function(error){
        resume_button();
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert('请允许浏览器访问地理信息。')
            break;
          case error.POSITION_UNAVAILABLE:
            alert('暂时无法在你的网络上获取地理位置信息，请稍后重试。')
            break;
          case error.TIMEOUT:
            alert('获取坐标的操作超时了，请稍后重试。');
            break;
          case error.UNKNOWN_ERROR:
            alert('发生了未知的错误。');
            break;
        }
      }, { enableHighAccuracy: true, timeout: 5000 });
    } else {
      alert('你的浏览器太旧了，不支持获取坐标，请用最新版浏览器。');
    }
  });
  var list_nearby_stores_text = $('#list_nearby_stores').text();
  $('#list_nearby_stores').on('click', function(){
    $('#list_nearby_stores').text('正在列出...').prop('disabled', true);
    var resume_button = function() { $('#list_nearby_stores').text(list_nearby_stores_text).prop('disabled', false); }
    var lat = $('#coord-lat').val(), lng = $('#coord-lng').val();
    $.getJSON('/api/stores', { lat: lat, lng: lng }, function(data){
      resume_button();
      $('#stores_list tbody').empty();
      $.each(data.stores, function(a, b){
        $('#stores_list tbody').append('<tr><td>' + (a + 1) + '</td><td>' +
          b[0] + '<br><small>' + b[4] + '</small></td><td>' + b[11].toFixed(3) + ' km' +
          '<br><small>' + b[9].toFixed(6) + ', ' + b[10].toFixed(6) + '</small></td></tr>')
      });
      $('#results').removeClass('hidden');
    });
  });
  var validate_coordinates = function() {
    if (/^\-?([0-9]|[1-8][0-9]|90)\.[0-9]{1,6}$/.test($('#coord-lat').val()) &&
        /^\-?([0-9]{1,2}|1[0-7][0-9]|180)\.[0-9]{1,6}$/.test($('#coord-lng').val())) {
      $('#list_nearby_stores').prop('disabled', false);
    } else {
      $('#list_nearby_stores').prop('disabled', true);
    }
  };
  $('#coord-lat, #coord-lng').on('keyup', function(){
    validate_coordinates();
  });
  validate_coordinates();
});
