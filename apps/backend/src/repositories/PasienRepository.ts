import { BaseRepository } from './BaseRepository';
import { Pasien } from '../types';
import { SqlConnection } from '../db/pool';

export class PasienRepository extends BaseRepository<Pasien, Partial<Pasien>, Partial<Pasien>> {
  constructor(db: SqlConnection) {
    super(db, 'Pasien', 'pasien_id', [
      'pasien_id',
      'no_rm',
      'nik',
      'nama',
      'jenis_kelamin',
      'tgl_lahir',
      'tempat_lahir',
      'alamat',
      'no_telepon',
      'gol_darah',
      'status_pernikahan',
      'pekerjaan',
      'ibu_pasien_id',
      'created_at',
      'email'
    ]);
  }

  protected mapRow(row: Record<string, unknown>): Pasien {
    return {
      pasienId: row['pasien_id'] as string,
      noRm: row['no_rm'] as string,
      nik: row['nik'] as string,
      nama: row['nama'] as string,
      jenisKelamin: row['jenis_kelamin'] as string,
      tglLahir: row['tgl_lahir'] as Date,
      tempatLahir: row['tempat_lahir'] as string,
      alamat: row['alamat'] as string,
      noTelepon: row['no_telepon'] as string,
      golDarah: (row['gol_darah'] as string) || null,
      statusPernikahan: (row['status_pernikahan'] as string) || null,
      pekerjaan: (row['pekerjaan'] as string) || null,
      ibuPasienId: (row['ibu_pasien_id'] as string) || null,
      email: (row['email'] as string) || null,
      createdAt: row['created_at'] as Date
    };
  }
}

export default PasienRepository;
