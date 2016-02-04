
var openWeatherMapAppid = ''
var subreddit = 'EarthPorn';
var imageExtensions = ['jpg', 'jpeg', 'png']
var currentIcon = ''

function backgroundQuery(subreddit) {
    return $.ajax({
        dataType: 'json',
        type: 'GET',
        url: 'http://www.reddit.com/r/' + subreddit + '/hot.json?limit=1'
    })
}

function getImageUrl(data) {
    var imgUrl = data.url
    if (imageExtensions.indexOf(imgUrl.toLowerCase().split('.').pop()) == -1) {
        if (imgUrl.indexOf('imgur') > 0) imgUrl += '.jpg'
        else imgUrl =  '/img/background.jpg'
    }
    return imgUrl
}

function getThreadData(result) {
    var threads = result.data.children
    return threads[threads.length - 1].data
}

function getBackground() {
    backgroundQuery(subreddit).done(function(result) {
        var data = getThreadData(result)
        var url = 'http://www.reddit.com' + data.permalink
        var title = data.title.replace(/\[.*]/g, '')
        var imageUrl = getImageUrl(data)
        setBackgroundSource(url, title)
        setBackgroundImage(imageUrl)
        saveData(url, title, imageUrl)
    })
}

function setBackground() {
    chrome.storage.local.get('data', function(result) {
        if ('data' in result) {
            setBackgroundSource(result.data.url, result.data.title)
            setBackgroundImage(result.data.imageUrl)
        } else getBackground()
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

function setBackgroundSource(url, title) {
    $('#background-source').attr('href', url).text(title)
}

function saveData(url, title, imageUrl) {
    chrome.storage.local.set({
        'data': {
            'url': url,
            'title': title,
            'imageUrl': imageUrl
        }
    })
}

function saveLocation() {
    var location = $(this).val()
    chrome.storage.local.set({
        'location': location
    })
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
        url: 'http://api.openweathermap.org/data/2.5/weather?q=' + query + '&type=like&units=metric&APPID=' + openWeatherMapAppid
    })
}

function renderWeather(weather) {
    $('.weather-info .temperature').text(weather.main.temp.toFixed(1) + ' °C')
    $('.weather-info .description').text(weather.weather[0].description)

    var iconUrl = getIconUrl(weather)
    if (iconUrl != currentIcon) {
        currentIcon = iconUrl
        $.get(iconUrl, renderIcon)
    }
}

function renderIcon(icon) {
    $('.weather-icon').html(icon)
}

function timestampToDate(timestamp) { return new Date(timestamp * 1000) }

function getIconUrl(weather) {
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

function getWeather(location) {
    weatherQuery(location).done(function(data) {
        renderWeather(data, location)
    })
}

function updateWeather() {
    chrome.storage.local.get('location', function(result) {
        if ('location' in result) getWeather(result.location)
    })
    setTimeout(updateWeather, 3000)
}

function initWeatherLocation() {
    chrome.storage.local.get('location', function(result) {
        if ('location' in result && result.location != '') {
            $('.weather input').val(result.location)
        } else {
            chrome.storage.local.set({
                'location': 'Vantaa'
            })
            $('.weather input').val('Vantaa')
        }
    })
    updateWeather()
}

$(function() {
    $('.weather-info').on('keyup', '.weather-location', saveLocation)

    setBackground()
    updateClock()
    initWeatherLocation()
    setTimeout(getBackground, 3000)
})
