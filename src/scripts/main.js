const remote = require('electron').remote
const open = require('open')
const fs = require('fs')
const Chart = require('chart.js')
let chatFile = {}
let stats = {
  usersMessageCount: {},
  messagesPerWeek: {},
  channelActivity: {},
  averageDayActivity: []
}
let filters = {
  user: null,
  channel: null
}

$(() => {
  $("#header").hide()
	$(document).on("keydown", (e) => {
		if(e.keyCode === 123) remote.getCurrentWindow().toggleDevTools()
		else if (e.keyCode === 116) location.reload()
  })
  $('#header .input').on('change', () => {
    if($('#stats').css("display") == "hidden") return
    extractStats()
    viewStats()
  })
  $('#input').on('click', () => {
    $('html').append('<input id="fileInput" type="file" style="display: none" accept=".json"/>')
    let input = $('#fileInput')

    input.trigger('click')

    input.on('change', (event) => {
      let url = $('#fileInput').prop('files')[0].path
      input.remove()
      $('#input').remove()
      $('#noChatFile').remove()
      

      fs.readFile(url, 'utf8', async (err, data) => {
        if (err) throw err
        chatFile = JSON.parse(data)
        extractStats()
        viewStats()
      })
    })
  })
})

async function extractStats() {
  let allChats = []
  let meta = chatFile.meta
  let usersMessageCount1 = {}
  let channelActivity1 = {}
  let averageDayActivity = []
  let messageActivity1 = {
    week: {},
    month: {},
    day: {}
  }

  // check filters
  filters.user = $('#header .user').val()
  if(filters.user == '') filters.user = null

  filters.channel = $('#header .channel').val()
  if(filters.channel == '') filters.channel = null

  for(let i=0;i<144;i++) averageDayActivity[i] = 0

  // every channel
  for(let channelIdx in chatFile.data) {
    let channelChats = Object.values(chatFile.data[channelIdx])
    allChats = [...allChats, ...channelChats]
    channelActivity1[channelIdx] = channelChats.length
  }


  // every user
  for(let userIdx in meta.userindex) {
    usersMessageCount1[userIdx] = 0
  }

  // every chat
  for(let c of allChats) {

    let userID = meta.userindex[c.u]
    let userName = meta.users[userID].name
    if(filters.user) if(!(userID == filters.user || userName == filters.user)) continue

    usersMessageCount1[c.u] += 1

    let messageDate = new Date(c.t)

    // message activity
    let messageMonth = Math.floor(c.t/1000/60/60/24/31)
    let messageWeek = Math.floor(c.t/1000/60/60/24/7)
    let messageDay = Math.floor(c.t/1000/60/60/24/1)

    if(!messageActivity1.month[messageMonth]) messageActivity1.month[messageMonth] = 0
    if(!messageActivity1.week[messageWeek]) messageActivity1.week[messageWeek] = 0
    if(!messageActivity1.day[messageDay]) messageActivity1.day[messageDay] = 0

    messageActivity1.month[messageMonth] += 1
    messageActivity1.week[messageWeek] += 1
    messageActivity1.day[messageDay] += 1

    // day activity
    let messageTenMinutes = Math.round((messageDate.getHours()*60 + messageDate.getMinutes())/10)
    averageDayActivity[messageTenMinutes]++
    
  }

  stats.averageDayActivity = averageDayActivity

  // channel activity
  let channelActivity2 = []
  for(let cID in channelActivity1) {
    channelActivity2.push([meta.channels[cID].name, channelActivity1[cID]])
  }
  channelActivity2.sort((a, b) => b[1]-a[1])

  let channelActivity3 = {}
  for(let c of channelActivity2) {
    channelActivity3[c[0]] = c[1]
  }

  stats.channelActivity = channelActivity3


  // user messages count
  let usersMessageCount2 = []
  for(let idx in usersMessageCount1) {
    let username = meta.users[meta.userindex[idx]].name
    let messageCount = usersMessageCount1[idx]
    usersMessageCount2.push([username, messageCount])
  }
  usersMessageCount2.sort((a, b) => b[1]-a[1])
  let usersMessageCount3 = usersMessageCount2.slice(0, 10)
  let userMessageCount4 = {messageCount: [], users: []}
  for(let u of usersMessageCount3) {
    let username = u[0]
    let messageCount = u[1]
    userMessageCount4.users.push(username)
    userMessageCount4.messageCount.push(messageCount)
  }
  stats.usersMessageCount = userMessageCount4

  // messageActivity
  let messageActivity2 = {
    day: [],
    week: [],
    month: []
  }
  // day
  for(let day in messageActivity1.day) {
    messageActivity2.day.push({x: new Date(day*24*60*60*1000), y: messageActivity1.day[day]})

  }
  // week
  for(let week in messageActivity1.week) {
    messageActivity2.week.push({x: new Date(week*7*24*60*60*1000), y: messageActivity1.week[week]})
  }
  // month
  for(let month in messageActivity1.month) {
    messageActivity2.month.push({x: new Date(month*31*24*60*60*1000), y: messageActivity1.month[month]})
  }
  stats.messageActivity = messageActivity2
  

  return
}

function viewStats() {
  $("#header").fadeIn()
  $('#stats').fadeIn()

  $('#stats .stat .index').html('<canvas></canvas>')
  // For a pie chart
  let randomBackgroundColors = []
  for(let i=0;i<stats.usersMessageCount.messageCount.length;i++) randomBackgroundColors[i] = randomColorHex()
  
  new Chart($('#msgPerUserPie .index canvas')[0].getContext('2d'), {
    type: 'pie',
    data: {
      datasets: [{
        data: stats.usersMessageCount.messageCount,
        backgroundColor: randomBackgroundColors,
      }],
      labels: stats.usersMessageCount.users
    },
    options: {
    }
  })



  // messageActivity
  new Chart($('#messageActivity .index canvas')[0].getContext('2d'), {
    type: 'line',
    data: {
      datasets: [{
        data: stats.messageActivity.day,
        backgroundColor: randomColorHex(),
        pointRadius: 0,
        label: "Messages Per Day"
      },
      {
        data: stats.messageActivity.week,
        backgroundColor: randomColorHex(),
        pointRadius: 0,
        label: "Messages Per Week"
      },
      {
        data: stats.messageActivity.month,
        backgroundColor: randomColorHex(),
        pointRadius: 0,
        label: "Messages Per Month"
      }]
    },
    options: {
      scales: {
        xAxes: [{
          type: "time",
          time: {
            unit: 'day',
            unitStepSize: 20,
          },
          gridLines: {
            display: false
          }
        }],
      }
    }
  })

  // channel activity
  new Chart($('#channelActivity .index canvas')[0].getContext('2d'), {
    type: 'bar',
    data: {
      datasets: [{
        data: Object.values(stats.channelActivity).slice(0, 10),
        backgroundColor: randomColorHex(),
        label: 'Channels'
      }],
      labels: Object.keys(stats.channelActivity).slice(0, 10)
    },
    options: {}
  })

  // averageDayActivity
  let averageDayActivity_Labels = []
  for(let i=0;i<24;i++) for(let j=0;j<6;j++) averageDayActivity_Labels.push(`${i > 10 ? i : '0'+i}:${10*j}`)
  new Chart($('#averageDayActivity .index canvas')[0].getContext('2d'), {
    type: 'line',
    data: {
      datasets: [{
        data: stats.averageDayActivity,
        backgroundColor: randomColorHex(),
        label: 'Activity'
      }],
      labels: averageDayActivity_Labels
    }
  })
}

function randomColorRGB() {
  let r = Math.floor(Math.random()*255)
  let g = Math.floor(Math.random()*255)
  let b = Math.floor(Math.random()*255)
  return [r, g, b]
}
function randomColorHex() {
  let rgb = randomColorRGB()
  let hex = rgbToHex(rgb[0], rgb[1], rgb[2])
  return hex
}
function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}
function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
function openDiscordHistoryTracker() {
  open('https://dht.chylex.com/')
}