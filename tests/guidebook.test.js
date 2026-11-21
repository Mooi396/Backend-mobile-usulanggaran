import test from "node:test";
import assert from "node:assert/strict";
import { guidebookCategories, guidebookScope, validateGuidebookInput } from "../services/guidebook.js";

test("akses guidebook dibatasi ke kategori role dan superadmin dapat melihat semua", () => {
    assert.deepEqual(guidebookScope("tim_sakip"), { kategori: "tim_sakip" });
    assert.deepEqual(guidebookScope("superadmin"), {});
    assert.throws(() => guidebookScope("unknown"), error => error.status === 403);
});

test("input guidebook menerima beberapa gambar dan menolak kategori atau gambar tidak valid", () => {
    assert.deepEqual(
        validateGuidebookInput({ judul: "Panduan SAKIP", gambar: ["/storage/1.png"], kategori: "tim_sakip" }),
        { data: { judul: "Panduan SAKIP", gambar: ["/storage/1.png"], kategori: "tim_sakip" } }
    );
    assert.equal(validateGuidebookInput({ judul: "Panduan", gambar: [], kategori: "tim_sakip" }).error, "Gambar artikel wajib berupa array URL atau path yang tidak kosong.");
    assert.equal(validateGuidebookInput({ judul: "Panduan", gambar: ["/gambar.png"], kategori: "superadmin" }).error, "Kategori guidebook tidak valid.");
    assert.deepEqual(guidebookCategories, ["operator", "pimpinan_unit", "tim_sakip", "spi", "kpa"]);
});
