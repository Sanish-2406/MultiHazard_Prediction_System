const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src');

const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}]/gu;

function cleanDir(directory) {
  fs.readdirSync(directory).forEach(file => {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      cleanDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (emojiRegex.test(content)) {
        content = content.replace(emojiRegex, '');
        // Clean up any empty span icons leftover from emoji removal
        content = content.replace(/<span className="icon"><\/span>/g, '');
        content = content.replace(/<span className="icon">\s*<\/span>/g, '');
        content = content.replace(/<div className="placeholder-icon">\s*<\/div>/g, '<div className="placeholder-icon">ℹ️</div>'.replace(emojiRegex, 'i')); // Safe replacement
        fs.writeFileSync(fullPath, content);
        console.log('Cleaned emojis from:', fullPath);
      }
    }
  });
}

cleanDir(dir);
