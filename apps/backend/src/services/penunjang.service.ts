import ApiError from '../errors/ApiError';
import PenunjangRepository from '../repositories/penunjang.repository';
import type { HasilLabBody, HasilRadBody, OrderBody } from '../validation/penunjang';

export class PenunjangService {
  constructor(private readonly repository: PenunjangRepository = new PenunjangRepository()) {}

  async createOrder(kunjunganId: string, body: OrderBody, stafId: string | null): Promise<{ order_id: string }> {
    const orderId = await this.repository.createOrder(kunjunganId, stafId, body.jenis);
    if (!orderId) {
      throw ApiError.internal('Gagal membuat order penunjang');
    }
    for (const layananId of body.layanan_ids) {
      await this.repository.createOrderDetail(orderId, layananId);
    }
    return { order_id: orderId };
  }

  listOrder(kunjunganId: string): Promise<Record<string, unknown>[]> {
    return this.repository.listOrder(kunjunganId);
  }

  async createHasilLab(body: HasilLabBody, stafId: string | null): Promise<Record<string, unknown>> {
    const row = await this.repository.createHasilLab({
      orderDetailId: body.order_detail_id,
      parameterId: body.parameter_id,
      stafId,
      nilai: body.nilai,
      flag: body.flag
    });
    if (!row) {
      throw ApiError.internal('Gagal menyimpan hasil lab');
    }
    await this.repository.markDetailSelesai(body.order_detail_id);
    return row;
  }

  async createHasilRadiologi(body: HasilRadBody, stafId: string | null): Promise<Record<string, unknown>> {
    const row = await this.repository.createHasilRadiologi({
      orderDetailId: body.order_detail_id,
      stafId,
      temuan: body.temuan,
      kesan: body.kesan,
      berkas: body.berkas_gambar
    });
    if (!row) {
      throw ApiError.internal('Gagal menyimpan hasil radiologi');
    }
    await this.repository.markDetailSelesai(body.order_detail_id);
    return row;
  }
}

export default PenunjangService;
