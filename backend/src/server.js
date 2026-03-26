import bcrypt from 'bcryptjs';
import { createServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { Role } from './models/Role.js';
import { User } from './models/User.js';
import { registerChatSocket } from './realtime/chatSocket.js';

async function seedRoles() {
  const count = await Role.countDocuments();
  if (count === 0) {
    const roles = ['user', 'listener', 'therapist', 'admin'];
    await Role.insertMany(roles.map((name) => ({ name })));
    console.log('Seeded roles:', roles.join(', '));
  }
}

function buildGeneratedAdminCredentials() {
  const seed = Buffer.from(env.jwtSecret).toString('hex').slice(0, 8) || 'mindbridge';
  return {
    email: `admin+${seed}@mindbridge.local`,
    password: `Admin@${seed}#`,
    name: env.adminName || 'MindBridge Admin'
  };
}

async function ensureBootstrapAdmin() {
  const generated = buildGeneratedAdminCredentials();
  const usingGeneratedCredentials = !env.adminEmail || !env.adminPassword;
  const canPrintPassword = env.nodeEnv !== 'production';

  const email = (env.adminEmail || generated.email).trim().toLowerCase();
  const password = (env.adminPassword || generated.password).trim();
  const name = (env.adminName || generated.name).trim();

  if (!password) {
    throw new Error('Bootstrap admin password is empty. Set ADMIN_PASSWORD in backend/.env');
  }

  const existing = await User.findOne({ email });
  if (existing) {
    if (!Array.isArray(existing.roles) || !existing.roles.includes('admin')) {
      existing.roles = Array.isArray(existing.roles) ? [...new Set([...existing.roles, 'admin'])] : ['admin'];
      await existing.save();
      console.log(`Updated existing user ${email} with admin role`);
    } else {
      console.log(`Bootstrap admin already present: ${email}`);
    }
    if (usingGeneratedCredentials) {
      console.log('Using generated bootstrap admin credentials. Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env to override.');
      console.log(`Generated admin email: ${email}`);
      if (canPrintPassword) {
        console.log(`Generated admin password: ${password}`);
      } else {
        console.log('Generated admin password hidden in production logs.');
      }
    }
    return;
  }

  const usernameBase = name || 'MindBridge Admin';
  let username = usernameBase;
  let suffix = 1;
  while (await User.findOne({ username }).lean()) {
    suffix += 1;
    username = `${usernameBase} ${suffix}`;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({
    username,
    email,
    passwordHash,
    roles: ['admin']
  });

  console.log(`Created bootstrap admin account: ${email}`);
  if (usingGeneratedCredentials) {
    console.log('Using generated bootstrap admin credentials. Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env to override.');
    console.log(`Generated admin email: ${email}`);
    if (canPrintPassword) {
      console.log(`Generated admin password: ${password}`);
    } else {
      console.log('Generated admin password hidden in production logs.');
    }
  }
}

async function start() {
  await connectDb();
  await seedRoles();
  await ensureBootstrapAdmin();
  const app = createApp();
  const server = createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: env.corsOrigin,
      credentials: true
    }
  });
  registerChatSocket(io);
  app.locals.io = io;

  server.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
