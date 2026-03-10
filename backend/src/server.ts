import app from './app.js'

const PORT = process.env.PORT || 5000;

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})