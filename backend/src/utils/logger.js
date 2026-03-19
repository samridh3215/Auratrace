const fs = require('fs');
const path = require('path');

const LOG_DIR = path.resolve(__dirname, '../../logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');
const MAX_LOG_BYTES = 5 * 1024 * 1024; // 5MB cap — rotate by truncating oldest half

if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

const timestamp = () => new Date().toISOString();

const write = (level, message) => {
    const line = `[${timestamp()}] [${level}] ${message}\n`;
    process.stdout.write(line);

    fs.appendFile(LOG_FILE, line, (appendErr) => {
        if (appendErr) {
            process.stderr.write(`[Logger] appendFile error: ${appendErr.message}\n`);
            return;
        }
        // Rotate log if it exceeds the cap
        fs.stat(LOG_FILE, (statErr, stats) => {
            if (statErr || stats.size <= MAX_LOG_BYTES) return;
            fs.readFile(LOG_FILE, 'utf8', (readErr, content) => {
                if (readErr) return;
                // Keep the newest half
                const trimmed = content.slice(Math.floor(content.length / 2));
                const afterNewline = trimmed.indexOf('\n');
                fs.writeFile(LOG_FILE, trimmed.slice(afterNewline + 1), () => {});
            });
        });
    });
};

const info  = (message)       => write('INFO',  message);
const warn  = (message)       => write('WARN',  message);
const error = (message, err)  => {
    write('ERROR', message);
    if (err?.stack) write('ERROR', `Stack: ${err.stack}`);
};

module.exports = { info, warn, error, LOG_FILE };
