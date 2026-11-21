export const guidebookCategories = ["operator", "pimpinan_unit", "tim_sakip", "spi", "kpa"];

export const guidebookScope = role => {
    if (role === "superadmin") return {};
    if (!guidebookCategories.includes(role)) {
        const error = new Error("Akses terlarang untuk peran Anda.");
        error.status = 403;
        throw error;
    }
    return { kategori: role };
};

export const validateGuidebookInput = (input = {}, { partial = false } = {}) => {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        return { error: "Data guidebook tidak valid." };
    }

    const data = {};

    if (!partial || input.judul !== undefined) {
        if (typeof input.judul !== "string" || !input.judul.trim()) {
            return { error: "Judul wajib diisi." };
        }
        data.judul = input.judul.trim();
    }

    if (!partial || input.gambar !== undefined) {
        if (!Array.isArray(input.gambar) || input.gambar.length === 0 ||
            input.gambar.some(gambar => typeof gambar !== "string" || !gambar.trim())) {
            return { error: "Gambar artikel wajib berupa array URL atau path yang tidak kosong." };
        }
        data.gambar = input.gambar.map(gambar => gambar.trim());
    }

    if (!partial || input.kategori !== undefined) {
        if (!guidebookCategories.includes(input.kategori)) {
            return { error: "Kategori guidebook tidak valid." };
        }
        data.kategori = input.kategori;
    }

    return { data };
};
