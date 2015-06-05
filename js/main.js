
var weatherLocation = 'Vantaa';
var subreddit = 'EarthPorn';
var imageExtensions = ['jpg', 'jpeg', 'png']

function backgroundQuery(subreddit) {
    return $.ajax({
        dataType: 'json',
        type: 'GET',
        url: 'http://www.reddit.com/r/' + subreddit + '/hot.json?limit=1'
    })
}

function getImageUrl(data) {
    var imgUrl = data.data.children[1].data.url
    if (imageExtensions.indexOf(imgUrl.toLowerCase().split('.').pop()) == -1) {
        if (imgUrl.indexOf('imgur') > 0) imgUrl += '.jpg'
        else imgUrl =  '/img/background.jpg'
    }
    return imgUrl
}

function getBackground() {
    backgroundQuery(subreddit).done(function(data) {
        var imageUrl = getImageUrl(data)
        setBackgroundImage(imageUrl)
        chrome.storage.local.set({'imageUrl': imageUrl}, function() { console.log('saved ' + imageUrl)})
    })
}

function setBackground() {
    chrome.storage.local.get('imageUrl', function(imageUrl) {
        if ('imageUrl' in imageUrl) setBackgroundImage(imageUrl.imageUrl)
        else getBackground()
        setInterval(getBackground, 10 * 60 * 1000) // 10 minutes
    })
}

function setBackgroundImage(url) {
    if ($('body').css('background-image').indexOf(url) == -1) {
        $("<img/>").attr("src", url).load(function() {
            $(this).remove()
            $('body').css("background-image", "url(" + url + ")")
        })
    }
}

function updateClock() {
    var now = new Date()
    $('#clock').text(now.getHours() + ':' + (now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes()))
    setTimeout(updateClock, (60 - new Date().getSeconds()) * 1000)
}

function weatherQuery(query) {
    return $.ajax({
        dataType: 'json',
        type: 'GET',
        url: 'http://api.openweathermap.org/data/2.5/weather?q=' + query + '&type=like&units=metric'
    })
}

function renderWeather(weather) {
    $('.weather-info')
        .html('<h2>Weather in ' + weather.name + '</h2>')
        .append('<h1>' + weather.main.temp.toFixed(1) + ' °C</h1>')
        .append('<h2>' + weather.weather[0].description + '</h2>')
    $.get(iconUrl(weather), renderIcon)
}

function renderIcon(icon) {
    $('.weather-icon').html(icon)
}

function timestampToDate(timestamp) { return new Date(timestamp * 1000) }

function iconUrl(weather) {
    var weatherId = weather.weather[0].id
    var baseUrl = '/img/'
    var now = new Date()
    var isDay = now > timestampToDate(weather.sys.sunrise) && now < timestampToDate(weather.sys.sunset)

    if (weatherId < 300) return baseUrl + 'thunder.svg'
    else if (weatherId < 500) return baseUrl + 'rain.svg'
    else if (weatherId < 600) return baseUrl + (isDay ? 'rain-sun.svg' : 'rain-moon.svg')
    else if (weatherId == 600 || weatherId == 615 || weatherId == 620) return baseUrl + (isDay ? 'snow-sun.svg' : 'snow-moon.svg')
    else if (weatherId < 700) return baseUrl + 'snow.svg'
    else if (weatherId < 800) return baseUrl + 'mist.svg'
    else if (weatherId == 800) return baseUrl + (isDay ? 'sun.svg' : 'moon.svg')
    else if (weatherId == 801) return baseUrl + (isDay ? 'cloud-sun.svg' : 'cloud-moon.svg')
    else if (weatherId == 802 || weatherId == 803 || weatherId == 804) return baseUrl + 'cloud.svg'
    else if (weatherId == 906) return baseUrl + 'hail.svg'
    else return baseUrl + 'sun.svg'
}

function getWeather() {
    weatherQuery(weatherLocation).done(renderWeather)
    setTimeout(getWeather, 5 * 60 * 1000)
}

$(function() {
    setBackground()
    getWeather()
    updateClock()
    setTimeout(getBackground, 3000)
})
