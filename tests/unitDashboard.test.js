import test from 'node:test';
import assert from 'node:assert/strict';
import { Op } from 'sequelize';
import { summarizeUnitDashboard, createUnitDashboardService } from '../services/unitDashboard.js';

test('saldo pagu dipakai langsung tanpa dikurangi pengajuan dua kali', () => {
    const summary = summarizeUnitDashboard([{ jenis_pagu: 'PNBP', nominal_pagu: '100' }, { jenis_pagu: 'RM', nominal_pagu: '200' }], [
        { pengajuan_id: 1, status: 'pending', current_position: 'pimpinan_unit', total_nominal_pengajuan: '80' },
        { pengajuan_id: 2, status: 'approved', current_position: 'completed', total_nominal_pengajuan: '40' },
        { pengajuan_id: 3, status: 'revision', current_position: 'operator', total_nominal_pengajuan: '20' },
    ]);
    assert.equal(summary.saldo_pagu, '300');
    assert.equal(summary.nominal_pengajuan, '140');
    assert.equal(summary.jumlah_pengajuan, 3);
    assert.deepEqual(summary.statuses.pending, { count: 1, amount: '80' });
    assert.equal(summary.statuses.approved.count, 1);
    assert.equal(summary.menunggu_pimpinan, 1);
    assert.equal(summary.revisi_operator, 1);
    assert.deepEqual(summary.latest.map(record => record.pengajuan_id), [3, 2, 1]);
});

test('nominal BIGINT, sumber dana gabungan dan lima pengajuan terbaru tetap tepat', () => {
    const records = Array.from({ length: 7 }, (_, i) => ({ pengajuan_id: i + 1, nomor_pengajuan: `USL/${i + 1}`, status: 'draft', current_position: 'operator', total_nominal_pengajuan: '9007199254740993' }));
    const summary = summarizeUnitDashboard([{ jenis_pagu: 'PNBP', nominal_pagu: '9007199254740993' }, { jenis_pagu: 'PNBP', nominal_pagu: '1' }], records);
    assert.equal(summary.saldo_pagu, '9007199254740994');
    assert.equal(summary.sources.length, 1);
    assert.equal(summary.nominal_pengajuan, (7n * 9007199254740993n).toString());
    assert.deepEqual(summary.latest.map(record => record.pengajuan_id), [7, 6, 5, 4, 3]);
    assert.equal(summary.statuses.draft.count, 7);
});

test('dashboard kosong menghasilkan saldo dan semua status nol', () => {
    const summary = summarizeUnitDashboard([], []);
    assert.equal(summary.saldo_pagu, '0');
    assert.equal(summary.jumlah_pengajuan, 0);
    assert.ok(Object.values(summary.statuses).every(status => status.count === 0 && status.amount === '0'));
    assert.deepEqual(summary.latest, []);
});

test('query dashboard memakai unit sesi dan cakupan pemeriksaan dalam satu transaksi', async () => {
    for (const role of ['operator', 'pimpinan_unit']) {
        const transaction = {};
        const inOperator = Op.in;
        const db = { transaction: run => run(transaction) };
        const verify = options => { assert.equal(options.transaction, transaction); assert.equal(options.where.kode_unit_kerja, 7); };
        const units = { async findOne(options) { verify(options); return { kode_unit_kerja: 7, unit_kerja: 'Jurusan Mesin' }; } };
        const pagus = { async findAll(options) { verify(options); return []; } };
        const pengajuans = { async findAll(options) {
            verify(options);
            if (role === 'pimpinan_unit') assert.deepEqual(options.where.max_position[inOperator], ['pimpinan_unit', 'tim_sakip', 'spi', 'kpa', 'completed']);
            else assert.equal(options.where.max_position, undefined);
            return [];
        } };
        const data = await createUnitDashboardService({ db, units, pagus, pengajuans, inOperator })({ role, kodeUnitKerja: 7 });
        assert.equal(data.unit.unit_kerja, 'Jurusan Mesin');
    }
});

test('akun tanpa unit, role di luar cakupan dan unit tidak ada ditolak', async () => {
    const load = createUnitDashboardService({ db: { transaction: run => run({}) }, units: { async findOne() { return null; } } });
    await assert.rejects(load({ role: 'operator', kodeUnitKerja: null }), error => error.status === 403);
    await assert.rejects(load({ role: 'superadmin', kodeUnitKerja: 7 }), error => error.status === 403);
    await assert.rejects(load({ role: 'operator', kodeUnitKerja: 7 }), error => error.status === 404);
});
