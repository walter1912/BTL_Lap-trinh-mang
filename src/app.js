const express = require('express')
const app = express()
const port = 3001
//route
app.get('/', (req, res) => {
  res.send('Hello World!')
})
app.get('/login', (req, res) => {
  res.send("trang login")
})
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
