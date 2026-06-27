import { readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const appDir = path.join(rootDir, 'app');

const pageContent = `export default function Page() {
  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Coming soon</h1>
    </main>
  );
}
`;

const routeContent = `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'API route stub' });
}
`;

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (entry.isFile() && statSync(fullPath).size === 0) {
      if (entry.name === 'page.tsx') {
        writeFileSync(fullPath, pageContent, 'utf8');
        console.log(`Filled ${path.relative(rootDir, fullPath)}`);
      }
      if (entry.name === 'route.ts') {
        writeFileSync(fullPath, routeContent, 'utf8');
        console.log(`Filled ${path.relative(rootDir, fullPath)}`);
      }
    }
  }
}

walk(appDir);
