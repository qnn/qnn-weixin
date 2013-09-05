$(function(){
  $('#get_my_coord').on('click', function(){
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position){
        $('#coord-lat').val(position.coords.latitude);
        $('#coord-lng').val(position.coords.longitude);
      });
    } else {
      alert('你的浏览器太旧了，不支持获取坐标，请用最新版浏览器。');
    }
  });
});
