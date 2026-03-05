import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** 최소 React/TS 프로젝트 fixture 생성 */
export async function createFixtureProject(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "fe-auto-eval-"));

  // package.json
  await writeFile(
    join(dir, "package.json"),
    JSON.stringify(
      {
        name: "eval-fixture",
        private: true,
        type: "module",
        dependencies: {
          react: "^19.0.0",
          "react-dom": "^19.0.0",
          "@tanstack/react-query": "^5.0.0",
        },
        devDependencies: {
          typescript: "^5.5.0",
          "@types/react": "^19.0.0",
          "@types/react-dom": "^19.0.0",
        },
      },
      null,
      2
    )
  );

  // tsconfig.json
  await writeFile(
    join(dir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "bundler",
          jsx: "react-jsx",
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          outDir: "dist",
          baseUrl: ".",
          paths: { "@/*": ["src/*"] },
        },
        include: ["src/**/*.ts", "src/**/*.tsx"],
      },
      null,
      2
    )
  );

  // 최소 src 구조
  await mkdir(join(dir, "src", "pages"), { recursive: true });
  await mkdir(join(dir, "src", "shared", "api"), { recursive: true });

  // httpClient stub
  await writeFile(
    join(dir, "src", "shared", "api", "httpClient.ts"),
    `export const httpClient = {
  get: async <T>(url: string, params?: Record<string, unknown>): Promise<T> => {
    throw new Error("stub");
  },
  post: async <T>(url: string, body?: unknown): Promise<T> => {
    throw new Error("stub");
  },
  put: async <T>(url: string, body?: unknown): Promise<T> => {
    throw new Error("stub");
  },
  delete: async <T>(url: string): Promise<T> => {
    throw new Error("stub");
  },
};
`
  );

  return dir;
}

/** fixture 정리 */
export async function cleanupFixtureProject(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}
