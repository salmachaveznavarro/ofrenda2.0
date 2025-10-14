const express = require('express');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');

const app = express();

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/ofrenda', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB conectado'))
  .catch(err => console.error('Error MongoDB:', err));

// Esquema de memorial/ofrenda
const memorialSchema = new mongoose.Schema({
  nombre: String,
  edad: String,
  tipo: String,
  recuerdo: String,
  ofrendas: [String],
  imagen: String,
  timestamp: { type: Date, default: Date.now },
  velitas: { type: Number, default: 0 }
});
const Memorial = mongoose.model('Memorial', memorialSchema);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Carpeta para subir imágenes
const upload = multer({ storage: multer.memoryStorage() });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname)));

// Rutas de páginas
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/ver', (req, res) => res.sendFile(path.join(__dirname, 'ver.html')));
app.get('/ofrenda', (req, res) => res.sendFile(path.join(__dirname, 'ofrenda.html')));

// Subir memorial/ofrenda
app.post('/subir', upload.single('imagen'), async (req, res) => {
  const { nombre, edad, tipo, recuerdo } = req.body;

  if (!req.file || !nombre || !edad || !tipo || !recuerdo) {
    return res.status(400).json({ ok: false, error: 'Faltan datos' });
  }

  // Guardar imagen en uploads/
  const filename = Date.now() + '-' + req.file.originalname;
  const filepath = path.join(__dirname, 'uploads', filename);
  require('fs').writeFileSync(filepath, req.file.buffer);

  // Guardar en MongoDB
  const newMemorial = new Memorial({
    nombre,
    edad,
    tipo,
    recuerdo,
    imagen: '/uploads/' + filename
  });

  await newMemorial.save();
  res.json({ ok: true, memorial: newMemorial });
});

// Agregar velitas
app.post('/velita', async (req, res) => {
  const { id } = req.body;
  const memorial = await Memorial.findById(id);
  if (!memorial) return res.status(404).json({ ok: false });

  memorial.velitas += 1;
  await memorial.save();
  res.json({ ok: true, velitas: memorial.velitas });
});

// Obtener todas las ofrendas
app.get('/ofrendas', async (req, res) => {
  const memorials = await Memorial.find().sort({ timestamp: -1 }); // más recientes primero
  res.json(memorials);
});

// Iniciar servidor
app.listen(3000, '0.0.0.0', () => console.log('Server ready at http://0.0.0.0:3000'));
