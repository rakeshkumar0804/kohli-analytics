import fs from 'node:fs';

const contentPath = 'C:/Users/Rakesh Rajput/.gemini/antigravity/brain/7abcb1cd-3bf9-4ef7-9e93-c538c72e4a8c/.system_generated/steps/3152/content.md';
const content = fs.readFileSync(contentPath, 'utf8');

console.log(content.slice(15000));
