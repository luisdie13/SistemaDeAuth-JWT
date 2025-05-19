require('dotenv').config();

// Debug: Verificar variables de entorno
console.log({
  dbHost: process.env.DB_HOST,
  dbUser: process.env.DB_USER,
  dbName: process.env.DB_NAME,
  dbPort: process.env.DB_PORT,
  dbPassword: process.env.DB_PASSWORD ? '*** (configurada)' : 'NO configurada',
  jwtSecret: process.env.JWT_SECRET ? '*** (configurada)' : 'NO configurada'
});

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('./database');

const app = express();
app.use(express.json());

// Validar configuración esencial
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 10) {
  console.error('ERROR: JWT_SECRET no está configurado o es demasiado corto');
  process.exit(1);
}

// Middleware de autenticación mejorado
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      error: 'Autorización requerida',
      details: 'Debe proporcionar un token Bearer'
    });
  }

  const [bearer, token] = authHeader.split(' ');
  
  if (bearer !== 'Bearer' || !token) {
    return res.status(401).json({ 
      error: 'Formato de token inválido',
      details: 'Formato correcto: Bearer <token>'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('Error de verificación JWT:', err.message);
      return res.status(403).json({ 
        error: 'Token inválido',
        details: err.message.includes('expired') ? 'Token expirado' : 'Token no válido'
      });
    }
    
    req.userId = decoded.userId;
    next();
  });
};

// Registro (protegido) con validaciones mejoradas
app.post('/register', requireAuth, async (req, res) => {
  const { username, email, password } = req.body;
  
  // Validación robusta
  if (!username || !email || !password) {
    return res.status(400).json({ 
      error: 'Validación fallida',
      details: 'Todos los campos (username, email, password) son requeridos'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: 'Contraseña insegura',
      details: 'La contraseña debe tener al menos 6 caracteres'
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );
    
    res.status(201).json({
      success: true,
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Error en registro:', err);
    
    if (err.code === '23505') {
      const detail = err.constraint.includes('username') 
        ? 'El nombre de usuario ya existe' 
        : 'El email ya está registrado';
      
      return res.status(409).json({ 
        error: 'Conflicto de datos',
        details: detail
      });
    }
    
    res.status(500).json({ 
      error: 'Error del servidor',
      details: 'No se pudo completar el registro'
    });
  }
});

// Login con mejor manejo de errores
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      error: 'Validación fallida',
      details: 'Email y contraseña son requeridos'
    });
  }

  try {
    // Debug: Verificar consulta a la base de datos
    console.log(`Buscando usuario con email: ${email}`);
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (!user.rows[0]) {
      console.log('Usuario no encontrado');
      return res.status(401).json({ 
        error: 'Autenticación fallida',
        details: 'Credenciales inválidas (usuario no encontrado)'
      });
    }

    // Debug: Comparación de contraseñas
    console.log('Comparando contraseñas...');
    const isPasswordValid = await bcrypt.compare(password, user.rows[0].password);
    
    if (!isPasswordValid) {
      console.log('Contraseña incorrecta');
      return res.status(401).json({ 
        error: 'Autenticación fallida',
        details: 'Credenciales inválidas (contraseña incorrecta)'
      });
    }

    const token = jwt.sign(
      { userId: user.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.rows[0].id,
        username: user.rows[0].username,
        email: user.rows[0].email
      }
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ 
      error: 'Error del servidor',
      details: 'No se pudo completar el login'
    });
  }
});

// Información de usuario con protección mejorada
app.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [req.userId]
    );
    
    if (!user.rows[0]) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        details: `El usuario con ID ${req.userId} no existe`
      });
    }
    
    res.json({
      success: true,
      user: user.rows[0]
    });
  } catch (err) {
    console.error('Error en /me:', err);
    res.status(500).json({ 
      error: 'Error del servidor',
      details: 'No se pudo obtener la información del usuario'
    });
  }
});

// Middleware para manejar rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    details: `La ruta ${req.method} ${req.path} no existe`
  });
});

// Manejo centralizado de errores
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Ocurrió un error'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log('Entorno:', process.env.NODE_ENV || 'development');
});