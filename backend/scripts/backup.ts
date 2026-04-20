import fs from 'fs';
import path from 'path';

const DB_DIR = path.join(__dirname, '..', '..');
const DB_FILE = 'campus_marketplace.db';
const BACKUP_DIR = path.join(DB_DIR, 'backup');

function createBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function getBackupFilename(): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `campus_marketplace_${timestamp}.db`;
}

function backupDatabase(): void {
  const dbPath = path.join(DB_DIR, DB_FILE);
  const backupFilename = getBackupFilename();
  const backupPath = path.join(BACKUP_DIR, backupFilename);

  if (!fs.existsSync(dbPath)) {
    console.error('Database file not found:', dbPath);
    process.exit(1);
  }

  createBackupDir();

  fs.copyFileSync(dbPath, backupPath);
  console.log(`Database backed up successfully to: ${backupPath}`);

  cleanupOldBackups(10);
}

function cleanupOldBackups(keepCount: number): void {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('campus_marketplace_') && f.endsWith('.db'))
    .sort()
    .reverse();

  if (files.length > keepCount) {
    const toDelete = files.slice(keepCount);
    toDelete.forEach(file => {
      const filePath = path.join(BACKUP_DIR, file);
      fs.unlinkSync(filePath);
      console.log(`Deleted old backup: ${file}`);
    });
  }
}

function listBackups(): void {
  createBackupDir();

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('campus_marketplace_') && f.endsWith('.db'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log('No backups found.');
    return;
  }

  console.log('Available backups:');
  files.forEach((file, index) => {
    const filePath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024).toFixed(2);
    const mtime = stats.mtime.toISOString().replace('T', ' ').slice(0, 19);
    console.log(`${index + 1}. ${file} (${size} KB, ${mtime})`);
  });
}

function restoreBackup(backupFilename?: string): void {
  createBackupDir();

  if (!backupFilename) {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('campus_marketplace_') && f.endsWith('.db'))
      .sort()
      .reverse();

    if (files.length === 0) {
      console.error('No backups found.');
      process.exit(1);
    }

    backupFilename = files[0];
    console.log(`No backup specified, using latest: ${backupFilename}`);
  }

  const backupPath = path.join(BACKUP_DIR, backupFilename);
  const dbPath = path.join(DB_DIR, DB_FILE);

  if (!fs.existsSync(backupPath)) {
    console.error('Backup file not found:', backupPath);
    process.exit(1);
  }

  fs.copyFileSync(backupPath, dbPath);
  console.log(`Database restored successfully from: ${backupPath}`);
}

const command = process.argv[2];

switch (command) {
  case 'backup':
    backupDatabase();
    break;
  case 'list':
    listBackups();
    break;
  case 'restore':
    restoreBackup(process.argv[3]);
    break;
  default:
    console.log('Database Backup Tool');
    console.log('');
    console.log('Usage:');
    console.log('  npm run backup          - Create a new backup');
    console.log('  npm run backup:list     - List all backups');
    console.log('  npm run backup:restore  - Restore from latest backup');
    console.log('  npm run backup:restore -- <filename.db> - Restore from specific backup');
    console.log('');
    console.log('Automatic backup: Configured in package.json scripts');
    break;
}