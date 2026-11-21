import db from '../db/pool';

export class PenunjangRepository {
  async createOrder(
    kunjunganId: string,
    stafId: string | null,
    jenis: string
  ): Promise<string | null> {
    const result = await db.query<{ order_id: string }>(
      `INSERT INTO [Order_Penunjang] (kunjungan_id, staf_pemesan_id, jenis, waktu_order, status)
       OUTPUT INSERTED.order_id
       VALUES (@kunjungan_id, @staf_id, @jenis, SYSDATETIME(), 'DIPESAN')`,
      { kunjungan_id: kunjunganId, staf_id: stafId, jenis }
    );
    return result.recordset[0]?.order_id ?? null;
  }

  async createOrderDetail(orderId: string, layananId: string): Promise<void> {
    await db.query(
      `INSERT INTO [Order_Penunjang_Detail] (order_id, layanan_id, status) VALUES (@order_id, @layanan_id, 'MENUNGGU')`,
      { order_id: orderId, layanan_id: layananId }
    );
  }

  async listOrder(kunjunganId: string): Promise<Record<string, unknown>[]> {
    const result = await db.query<Record<string, unknown>>(
      `SELECT o.order_id, o.jenis, o.waktu_order, o.status,
              d.order_detail_id, d.layanan_id, l.nama AS nama_layanan, d.status AS status_detail
         FROM [Order_Penunjang] o
         LEFT JOIN [Order_Penunjang_Detail] d ON d.order_id = o.order_id
         LEFT JOIN [Layanan_Medis] l ON l.layanan_id = d.layanan_id
        WHERE o.kunjungan_id = @id
        ORDER BY o.waktu_order DESC`,
      { id: kunjunganId }
    );
    return result.recordset;
  }

  async createHasilLab(input: {
    orderDetailId: string;
    parameterId: string;
    stafId: string | null;
    nilai: string;
    flag?: string;
  }): Promise<Record<string, unknown> | undefined> {
    const result = await db.query<Record<string, unknown>>(
      `INSERT INTO [Hasil_Lab] (order_detail_id, parameter_id, staf_id, nilai, flag, waktu)
       OUTPUT INSERTED.*
       VALUES (@detail, @parameter, @staf, @nilai, @flag, SYSDATETIME())`,
      {
        detail: input.orderDetailId,
        parameter: input.parameterId,
        staf: input.stafId,
        nilai: input.nilai,
        flag: input.flag ?? null
      }
    );
    return result.recordset[0];
  }

  async createHasilRadiologi(input: {
    orderDetailId: string;
    stafId: string | null;
    temuan: string;
    kesan: string;
    berkas?: string;
  }): Promise<Record<string, unknown> | undefined> {
    const result = await db.query<Record<string, unknown>>(
      `INSERT INTO [Hasil_Radiologi] (order_detail_id, radiolog_staf_id, temuan, kesan, berkas_gambar, waktu)
       OUTPUT INSERTED.*
       VALUES (@detail, @staf, @temuan, @kesan, @berkas, SYSDATETIME())`,
      {
        detail: input.orderDetailId,
        staf: input.stafId,
        temuan: input.temuan,
        kesan: input.kesan,
        berkas: input.berkas ?? null
      }
    );
    return result.recordset[0];
  }

  async markDetailSelesai(orderDetailId: string): Promise<void> {
    await db.query(
      `UPDATE [Order_Penunjang_Detail] SET status = 'SELESAI' WHERE order_detail_id = @id`,
      { id: orderDetailId }
    );
  }
}

export default PenunjangRepository;
