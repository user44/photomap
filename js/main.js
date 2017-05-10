VK.init({
	apiId: 5607112 // ID приложения VK
});

toastr.options = {
  "closeButton": false,
  "debug": false,
  "newestOnTop": false,
  "progressBar": false,
  "positionClass": "toast-top-right",
  "preventDuplicates": false,
  "onclick": null,
  "showDuration": "300",
  "hideDuration": "1000",
  "timeOut": "5000",
  "extendedTimeOut": "1000",
  "showEasing": "swing",
  "hideEasing": "linear",
  "showMethod": "fadeIn",
  "hideMethod": "fadeOut"
}

var qRadius = 500; // радиус охвата для запроса в метрах
var photoCount = 999; // количество фоток

function authInfo(response) {
	if (response.session) {
		getPhotos(qRadius, photoCount);
		$('.auth').hide();
		// $.notify("Все ok, грузим карту Новопскова...", {position: 'right top', className: 'success', showDuration: 200, autoHideDelay: 3000,});
		toastr.success("Все ok, грузим карту Новопскова...");
		toastr.info("Ожидаем ответ vk API...");
		// $.notify("Ожидаем ответ vk API...", {position: 'right top', className: 'info', showDuration: 200, autoHideDelay: 4000,});
		
	} else {
		$('.auth').show();
		// $.notify("Вам нужно авторизоваться!", {position: 'right top', className: 'warn', showDuration: 200, autoHideDelay: 4000,});
		toastr.warning("Вам нужно авторизоваться!");
	}
}

var map = L.map('map',{maxBounds:[[-90, -180],[90, 180]], /*maxZoom: 25*/}).setView([49.5358, 39.1080], 15);
L.tileLayer('http://b.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', { minZoom: 2, maxZoom: 20 }).addTo(map);

var np_center = [[49.537838085359446, 39.10236418247223]]; // Центр Новопскова
var map_сordinates = [[49.537838085359446, 39.10236418247223]]; // Координаты

var start_time = parseInt(new Date().getTime()/1000-3600*120); // пятью сутками ранее
var test_time = parseInt(new Date().getTime()/1000-3600*24);

var map_old_photo = [];

var getLastPhotos = function(radius_, count_) {
	var code = 'return [';
	for (var i=0;i<map_сordinates.length;i++) 
	{
		code += 'API.photos.search({"lat": "' + np_center[i][0] + '", "long": "' + np_center[i][1] + '", "start_time": "' + start_time + '", "radius": "' + radius_ + '", "count": "' + count_ + '", "sort": 0, "v": "5.27"})';
		if (i != np_center.length-1) 
			code += ',';
	}
	code += '];';

	VK.Api.call('execute', {'code': code}, function(data) {
		if (data.response) {
			if(data.response[0].items.length == 0) {
				setTimeout(function() {
					// $.notify("Пустой ответ (lp). Повторяем запрос...", {position: 'right top', className: 'info', showDuration: 200, autoHideDelay: 5000,});
					toastr.info("Пустой ответ (lp). Повторяем запрос...");
					getLastPhotos(900, 40);
				}, 3500);

			} else {
				// $.notify("Последние фото в сайдбаре!", {position: 'right top', className: 'success', showDuration: 200, autoHideDelay: 5000,});
				toastr.success("Последние фото в сайдбаре!");
				$(".sidebar-box").show();
			}

			for (var i=0;i<data.response.length;i++) 
			{	
				for (var j=0;j<data.response[i].items.length;j++)
				{

					var lPhoto = '<a href="http://vk.com/photo' + data.response[i].items[j].owner_id + '_' + data.response[i].items[j].id + '" target="_blank"><div class="last-photo" style="background-color: #f1f1f1; background-image: url(' + data.response[i].items[j].photo_130 + ');"></div></a>';
					$(".sidebar").append(lPhoto);

					if (j == 0) map_old_photo[i] = data.response[i].items[0].id;
				}
			}

		} else alert(data.error.error_code + ' ' + data.error.error_msg);
	});

}

var getPhotos = function(radius_, count_) {
	var code = 'return [';
	for (var i=0;i<map_сordinates.length;i++) 
	{
		code += 'API.photos.search({"lat": "' + map_сordinates[i][0] + '", "long": "' + map_сordinates[i][1] + '", "radius": "' + radius_ + '", "count": "' + count_ + '", "sort": 0, "v": "5.27"})';
		if (i != map_сordinates.length-1) 
			code += ',';
	}
	code += '];';
	
	VK.Api.call('execute', {'code': code}, function(data) {
		
		if (data.response) {

			if (data.response[0].items.length == 0) {
				setTimeout(function() {
					// $.notify("Пустой ответ. Повторяем запрос...", {position: 'right top', className: 'info', showDuration: 200, autoHideDelay: 5000,});
					toastr.info("Пустой ответ. Повторяем запрос...");
					getPhotos(qRadius, photoCount);
				}, 3500);

			} else {
				console.log('получено фото: ' + data.response[0].items.length);
				// $.notify("Получено " + data.response[0].items.length + " фото, загружаю...", {position: 'right top', className: 'success', showDuration: 200, autoHideDelay: 6000,});
				toastr.success("Получено " + data.response[0].items.length + " фото, загружаю...");
				window.setTimeout(function() {
					getLastPhotos(900, 40);
					// $.notify("Грузим последние фото...", {position: 'right top', className: 'info', showDuration: 200, autoHideDelay: 3000,});
					toastr.info("Грузим последние фото...");
					for (i=0; i<20; i++) {
						$(".leaflet-marker-pane").find(".leaflet-marker-icon:nth-child("+i+") .icon_photo").css("box-shadow", "0 0 6px 4px rgb(109, 220, 91)"); // подсвечиваем новые фото на карте
					}
					// $.notify("Новые фото подсвечены зеленым", {position: 'right top', className: 'info', showDuration: 200, autoHideDelay: 3000,});
					toastr.info("Новые фото подсвечены зеленым");
				}, 5000);
			}

			for (var i=0;i<data.response.length;i++)
			{
				for (var j=0;j<data.response[i].items.length;j++)
				{
					// if (data.response[i].items[j].id != map_old_photo[i]) 
					// {	
						if(data.response[i].items[j].lat) {
							var myIcon = L.divIcon({html: '<div style="background-image: url(' + data.response[i].items[j].photo_75 + ');" class="icon_photo"></div>'});
							L.marker([data.response[i].items[j].lat, data.response[i].items[j].long], {
								bounceOnAdd: true,
								icon: myIcon,
								riseOnHover: true
							}).addTo(map).bindPopup('<center><a href="http://vk.com/photo' + data.response[i].items[j].owner_id + '_' + data.response[i].items[j].id + '" target="_blank">Просмотреть на сайте<br/><div style="background-image: url(' + data.response[i].items[j].photo_604 + ');" class="icon_photo2"></div></a></center>');
							if (j == 0) map_old_photo[i] = data.response[i].items[0].id;
						}
					// } else break;
				}
				
			}

		} else alert(data.error.error_code + ' ' + data.error.error_msg);
	});

}
VK.Auth.getLoginStatus(authInfo);
VK.UI.button('login_button');

