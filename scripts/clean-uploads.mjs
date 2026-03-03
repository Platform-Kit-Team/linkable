#!/usr/bin/env node

/**
 * Deletes any files in public/uploads/ that are NOT referenced by the
 * CMS content JSON (cms-data.json or public/data.json) or by blog post
 * markdown files in content/blog/.
 *
 * Usage:  node scripts/clean-uploads.mjs [--dry-run]
 */

import { existsSync } from "node:fs";
import { readFile, readdir, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const uploadsDir = path.join(rootDir, "public/uploads");
const cmsDataPath = path.join(rootDir, "cms-data.json");
const publicDataPath = path.join(rootDir, "public/data.json");
const blogDir = path.join(rootDir, "content/blog");

const dryRun = process.argv.includes("--dry-run");

/** Recursively extract every string value from an arbitrary JSON tree. */
const extractStrings = (value) => {
  const strings = [];
  if (typeof value === "string") {
    strings.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) strings.push(...extractStrings(item));
  } else if (value && typeof value === "object") {
    for (const v of Object.values(value)) strings.push(...extractStrings(v));
  }
  return strings;
};

/** Extract /uploads/ references from a markdown blog post (frontmatter + body). */
const extractUploadsFromMarkdown = (content) => {
  const refs = [];
  // frontmatter values like  coverImage: /uploads/foo.jpg
  const fmRegex = /:\s*(\/uploads\/[^\s"']+)/g;
  let m;
  while ((m = fmRegex.exec(content))) refs.push(m[1]);

  // inline markdown images  ![alt](/uploads/foo.jpg)
  const imgRegex = /!\[[^\]]*\]\((\/uploads\/[^)]+)\)/g;
  while ((m = imgRegex.exec(content))) refs.push(m[1]);

  // html <img src="/uploads/foo.jpg">
  const htmlRegex = /src=["'](\/uploads\/[^"']+)["']/g;
  while ((m = htmlRegex.exec(content))) refs.push(m[1]);

  return refs;
};

const run = async () => {
  // ── 1. Load CMS data ──────────────────────────────────────────
  let dataPath = cmsDataPath;
  if (!existsSync(dataPath)) dataPath = publicDataPath;
  if (!existsSync(dataPath)) {
    console.log("No CMS data file found — nothing to clean.");
    return;
  }

  const raw = await readFile(dataPath, "utf8");
  const data = JSON.parse(raw);

  // ── 2. Collect referenced upload filenames ─────────────────────
  const allStrings = extractStrings(data);
  const referencedFiles = new Set(
    allStrings
      .filter((s) => s.startsWith("/uploads/"))
      .map((s) => s.replace(/^\/uploads\//, "")),
  );

  // ── 2b. Scan blog markdown files for upload references ─────────
  if (existsSync(blogDir)) {
    const blogEntries = await readdir(blogDir);
    const mdFiles = blogEntries.filter((f) => f.endsWith(".md"));
    for (const file of mdFiles) {
      const content = await readFile(path.join(blogDir, file), "utf8");
      const blogRefs = extractUploadsFromMarkdown(content);
      for (const ref of blogRefs) {
        referencedFiles.add(ref.replace(/^\/uploads\//, ""));
      }
    }
    if (mdFiles.length > 0) {
      console.log(`Scanned ${mdFiles.length} blog post(s) for image references.`);
    }
  }

  // ── 3. List actual files on disk ───────────────────────────────
  if (!existsSync(uploadsDir)) {
    console.log("public/uploads/ does not exist — nothing to clean.");
    return;
  }

  const entries = await readdir(uploadsDir);
  const files = entries.filter((f) => !f.startsWith(".")); // skip dotfiles

  // ── 4. Determine orphans ───────────────────────────────────────
  const orphans = files.filter((f) => !referencedFiles.has(f));

  if (orphans.length === 0) {
    console.log(`✓ All ${files.length} file(s) in public/uploads/ are referenced.`);
    return;
  }

  // ── 5. Delete (or report) orphans ──────────────────────────────
  console.log(
    dryRun
      ? `[dry-run] Would delete ${orphans.length} orphaned file(s):`
      : `Deleting ${orphans.length} orphaned file(s):`,
  );

  for (const file of orphans) {
    const filePath = path.join(uploadsDir, file);
    console.log(`  - ${file}`);
    if (!dryRun) {
      await unlink(filePath);
    }
  }

  const kept = files.length - orphans.length;
  console.log(
    dryRun
      ? `[dry-run] ${kept} file(s) would be kept.`
      : `Done. ${kept} file(s) kept, ${orphans.length} removed.`,
  );
};

run().catch((err) => {
  console.error("clean-uploads failed:", err);
  process.exit(1);
});
