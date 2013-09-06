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
    var lat = $('#coord-lat').val(), lng = $('#coord-lng').val();
    $.getJSON('/api/stores', { lat: lat, lng: lng }, function(data){
      $.each(data.stores, function(a, b){
        $('#stores_list tbody').append('<tr><td>' + (a + 1) + '</td><td>' +
          b[0] + '</td><td>' + b[4] + '</td><td>' + b[9] + ', ' + b[10] + '</td><td>' +
          b[11] + '</td></tr>')
      });
      $('#results').removeClass('hidden');
    })
  });
});
