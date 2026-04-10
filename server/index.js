import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import municipiosRoutes from './routes/municipios.js';
import upasRoutes from './routes/upas.js';
import medicosRoutes from './routes/medicos.js';
import escalasRoutes from './routes/escalas.js';
import turnosRoutes from './routes/turnos.js';
import alertasRoutes from './routes/alertas.js';
import relatoriosRoutes from './routes/relatorios.js';
import usuariosRoutes from './routes/usuarios.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middlewares ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/municipios', municipiosRoutes);
app.use('/api/upas', upasRoutes);
app.use('/api/medicos', medicosRoutes);
app.use('/api/escalas', escalasRoutes);
app.use('/api/turnos', turnosRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/usuarios', usuariosRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', sistema: 'MedBusca API', versao: '1.0.0' });
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  console.log(`\n🏥 MedBusca API rodando em http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health\n`);
  console.log('Credenciais de teste:');
  console.log('  superadmin@teste.com / 123456  → Super Admin');
  console.log('  gestor@teste.com      / 123456  → Gestor Municipal');
  console.log('  upa@teste.com         / 123456  → Gestor de UPA');
  console.log('  medico@teste.com      / 123456  → Médico\n');
});
