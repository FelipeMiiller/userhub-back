import 'reflect-metadata';
import { config } from 'dotenv';
import * as fs from 'fs';

const testEnvFile = `.env.test`;
const envFile = `.env`;

// Verificar se o arquivo .env existe
if (!fs.existsSync(envFile)) {
  throw new Error('.env file not found');
}

// Verificar se o arquivo .env.test existe
// Correção: a mensagem estava errada - "found" deveria ser "not found"
if (!fs.existsSync(testEnvFile)) {
  throw new Error('.env.test file not found');
}

// Carregar primeiro o .env padrão
config({ path: envFile });

// Sobrescrever com as configurações de teste
config({ path: testEnvFile, override: true });

// Configurações globais para testes
jest.setTimeout(30000);

// Garantir que estamos em ambiente de teste
process.env.NODE_ENV = 'test';


