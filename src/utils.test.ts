import { test } from "node:test";
import assert from "node:assert/strict";
import { canonicalizeTitle, capitalizeTitle, parseFilenameMetadata } from "./utils.js";

test("canonicalizeTitle strips filename extensions", () => {
  assert.equal(canonicalizeTitle("My Great Paper.pdf"), "my great paper");
});

test("canonicalizeTitle strips JSTOR boilerplate", () => {
  assert.equal(canonicalizeTitle("Some Article on JSTOR"), "some article");
});

test("canonicalizeTitle strips the Better BibTeX trailing 'a' suffix", () => {
  assert.equal(canonicalizeTitle("Frame Analysisa"), "frame analysis");
});

test("canonicalizeTitle leaves short trailing 'a' words alone", () => {
  assert.equal(canonicalizeTitle("Data"), "data");
});

test("capitalizeTitle title-cases words split on separators", () => {
  assert.equal(capitalizeTitle("hello_world-test.foo"), "Hello World Test Foo");
});

test("capitalizeTitle normalizes all-caps words", () => {
  assert.equal(capitalizeTitle("GARCIA BRENES"), "Garcia Brenes");
});

test("parseFilenameMetadata parses 'Author - Title Year'", () => {
  const result = parseFilenameMetadata("Goffman - Frame Analysis 1974.pdf");
  assert.deepEqual(result, {
    title: "Frame Analysis 1974",
    date: "1974",
    creators: [{ creatorType: "author", lastName: "Goffman", firstName: "" }],
  });
});

test("parseFilenameMetadata parses 'AUTHOR_YEAR_TITLE' filenames", () => {
  const result = parseFilenameMetadata("GARCIA_BRENES_MD_2000_Cambio_agrario_y_desarrollo_.pdf");
  assert.deepEqual(result, {
    title: "Cambio Agrario Y Desarrollo",
    date: "2000",
    creators: [{ creatorType: "author", lastName: "GARCIA BRENES MD", firstName: "" }],
  });
});

test("parseFilenameMetadata parses 'Author: Title' with no year", () => {
  const result = parseFilenameMetadata("Smith: Climate Change");
  assert.deepEqual(result, {
    title: "Climate Change",
    date: undefined,
    creators: [{ creatorType: "author", lastName: "Smith", firstName: "" }],
  });
});

test("parseFilenameMetadata parses 'YEAR TITLE' with unknown author", () => {
  const result = parseFilenameMetadata("2023 VULNERACION DE DERECHOS");
  assert.deepEqual(result, {
    title: "Vulneracion De Derechos",
    date: "2023",
    creators: [],
  });
});

test("parseFilenameMetadata returns null when no pattern matches", () => {
  assert.equal(parseFilenameMetadata("plain title"), null);
});
