const mongo = require('mongodb').MongoClient
const client = require('socket.io').listen(3000).sockets

// Connect to MongoDB
mongo.connect('mongodb://localhost/mongochat', function (error, db) {
  if (error) {
    throw error
  }
  console.log('MongoDB Connected...')

  // Connect to Socket.io
  client.on('connection', function (socket) {
    let chat = db.collection('chats')

    // Create function to send status
    const sendStatus = function (i) {
      socket.emit('status', i)
    }
    // Get Chat from Mongo Collection
    chat.find().limit(100).sort({ _id: -1 }).toArray(function (error, result) {
      if (error) {
        throw error
      }
      // Emit the result/message
      socket.emit('output', result)
    })
    // Handle input events
    socket.on('input', function (data) {
      let name = data.name
      let message = data.message

      // Check for name and message
      if (name === '' || message === '') {
        // Send error
        sendStatus('Please Enter a Name and Message')
      } else {
        // Insert Name and Message into DB
        chat.insert({ name: name, message: message }, function () {
          client.emit('output', [data])

          // Send status object
          sendStatus({
            message: 'Message Sent',
            clear: true
          })
        })
      }
    })

    // Handle Clearing Message
    socket.on('clear', function (data) {
      // Remove all chat from collection
      chat.remove({}, function () {
        // Emit message to let users know all messages have been cleared
        socket.emit('cleared')
      })
    })
  })
})
