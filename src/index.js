const http = require('http')
const path = require('path')
const express = require ('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocation } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users.js')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))


io.on('connection', (socket)=>{
    console.log('New web socket connection')

    

    socket.on('join', (options, callback)=>{
        
        const {error, user} = addUser({ id: socket.id, ...options })

        if(error){
           return callback(error)
        }
        
        socket.join(user.room)

        socket.emit('message', generateMessage('System admin', `Hey There! Welcome to chat room ${user.username}!`))
        socket.broadcast.to(user.room).emit('message', generateMessage('Server admin', `A ${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()

    })

    socket.on('sendmsg', (message, callback)=>{

        const posiljalac = getUser(socket.id)

        const filter = new Filter()
        
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed!')
        }

        io.to(posiljalac.room).emit('message', generateMessage(posiljalac.username, message))
        callback()
    })

    socket.on('sendLocation', (coords, callback)=>{
        const posiljalacLok = getUser(socket.id)

        io.to(posiljalacLok.room).emit('locationMessage', generateLocation(posiljalacLok.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

    socket.on('disconnect', ()=>{
        
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message', generateMessage('System admin', `${user.username} has left this chat room`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, ()=>{
    console.log('Server is up and running on ' + port)
})