const socket = io()

//Elements
const $messageForm = document.querySelector('#messageForm')
const $messageFormInput = $messageForm.querySelector('input')
const $SendMessageBtn =$messageForm.querySelector('button')
const $sendLocationBtn = document.querySelector('#sendLocation')
const $msgs = document.querySelector('#msgs')

//Templates
const msgTemplate = document.querySelector('#messageTemplate').innerHTML
const locTemplate = document.querySelector('#locationTemplate').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//OPTIONS
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = ()=>{
    // New message element
    const $newmsg = $msgs.lastElementChild

    // get hight of new message
    const newmsgStyles = getComputedStyle($newmsg)
    const newmsgMargin = parseInt(newmsgStyles.marginBottom)
    const newmsgHeight = $newmsg.offsetHeight + newmsgMargin

    // visible height
    const visibleHeight = $msgs.offsetHeight

    //height of messages container
    const containerHeight = $msgs.scrollHeight

    //how far have i scrolled
    const scrollOffset = $msgs.scrollTop + visibleHeight

    if(containerHeight - newmsgHeight <= scrollOffset){
         $msgs.scrollTop = $msgs.scrollHeight
    }


}


socket.on('message', (message)=>{
    console.log(message)
    const html = Mustache.render(msgTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("dddd, HH:mm")

    })
    $msgs.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message)=>{
    
    const html = Mustache.render(locTemplate, {
        username: message.username,
        url: message.url,

        createdAt: moment(message.createdAt).format("dddd, HH:mm")
    })

    $msgs.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users})=>{
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    document.querySelector('#sidebar').innerHTML = html

})

$messageForm.addEventListener('submit', (e)=>{
    e.preventDefault()
    //disable btn///
    $SendMessageBtn.setAttribute('disabled', 'disabled')

    const message = e.target.elements.InputZaPoruku.value

    socket.emit('sendmsg', message, (error)=>{
        //enable btn//
        $SendMessageBtn.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(error){
            return console.log(error)
        }

        console.log('message delivered')
    })
})

$sendLocationBtn.addEventListener('click', ()=>{
    if(!navigator.geolocation){
        return alert('Your browser does not support geolocation')
    }
    $sendLocationBtn.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position)=>{
        // console.log(position)
        socket.emit('sendLocation', { 
            
            latitude: position.coords.latitude, 
            longitude: position.coords.longitude
        }, ()=>{

            $sendLocationBtn.removeAttribute('disabled')

            console.log('location shared')
        })
    })

})


socket.emit('join', {username, room}, (error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }
})