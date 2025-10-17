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
// Subir memorial/ofrenda
app.post('/subir', upload.single('imagen'), async (req, res) => {
  try {
    console.log('=== Nuevo request /subir ===');
    console.log('Body recibido:', req.body);
    console.log('Archivo recibido:', req.file);

    const { nombre, edad, tipo, recuerdo } = req.body;

    // Validar datos
    if (!req.file || !nombre || !edad || !tipo || !recuerdo) {
      console.log('Faltan datos en el request');
      return res.status(400).json({ ok: false, error: 'Faltan datos' });
    }

    // Asegurar que exista carpeta uploads
    const uploadsDir = path.join(__dirname, 'uploads');
    const fs = require('fs');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
      console.log('Carpeta uploads creada');
    }

    // Guardar imagen en uploads/
    const filename = Date.now() + '-' + req.file.originalname;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, req.file.buffer);
    console.log('Imagen guardada en:', filepath);

    // Guardar en MongoDB
    const newMemorial = new Memorial({
      nombre,
      edad,
      tipo,
      recuerdo,
      imagen: '/uploads/' + filename
    });

    await newMemorial.save();
    console.log('Memorial guardado en MongoDB con ID:', newMemorial._id);

    res.json({ ok: true, memorial: newMemorial });

  } catch (err) {
    console.error('Error guardando memorial:', err);
    res.status(500).json({ ok: false, error: 'Error interno al guardar' });
  }
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
