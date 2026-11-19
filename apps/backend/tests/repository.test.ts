import BaseRepository, { QueryRunner } from '../src/repositories/BaseRepository';

interface Baris {
  id: string;
  nama: string;
}

class FakeRunner implements QueryRunner {
  rows: Record<string, unknown>[] = [];
  lastQuery = '';
  lastParams: Record<string, unknown> = {};

  async query(text: string, params: Record<string, unknown> = {}): Promise<{ recordset: Record<string, unknown>[] }> {
    this.lastQuery = text;
    this.lastParams = params;
    return { recordset: this.rows };
  }
}

class BarisRepository extends BaseRepository<Baris, { nama: string }, { nama: string }> {
  constructor(db: QueryRunner) {
    super(db, '[Tabel_Uji]', 'id', ['id', 'nama']);
  }

  protected mapRow(row: Record<string, unknown>): Baris {
    return { id: String(row['id'] ?? ''), nama: String(row['nama'] ?? '') };
  }
}

describe('BaseRepository (unit)', () => {
  let db: FakeRunner;
  let repo: BarisRepository;

  beforeEach(() => {
    db = new FakeRunner();
    repo = new BarisRepository(db);
  });

  test('findById mengembalikan baris terpetakan', async () => {
    db.rows = [{ id: 'a1', nama: 'Ani' }];
    await expect(repo.findById('a1')).resolves.toEqual({ id: 'a1', nama: 'Ani' });
    expect(db.lastQuery).toContain('[Tabel_Uji]');
    expect(db.lastParams).toEqual({ id: 'a1' });
  });

  test('findById mengembalikan null saat kosong', async () => {
    await expect(repo.findById('x')).resolves.toBeNull();
  });

  test('findAll memakai pagination OFFSET/FETCH dan filter kolom', async () => {
    db.rows = [{ id: 'a1', nama: 'Ani' }];
    const rows = await repo.findAll({ limit: 5, offset: 10, where: { nama: 'Ani' } });
    expect(rows).toHaveLength(1);
    expect(db.lastQuery).toContain('OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY');
    expect(db.lastQuery).toContain('nama = @nama');
    expect(db.lastParams).toEqual({ nama: 'Ani', offset: 10, limit: 5 });
  });

  test('findAll menolak kolom di luar whitelist', async () => {
    await expect(repo.findAll({ where: { rahasia: 1 } })).rejects.toThrow('Invalid identifier');
  });

  test('create memakai OUTPUT INSERTED dan memetakan hasil', async () => {
    db.rows = [{ id: 'a2', nama: 'Budi' }];
    const row = await repo.create({ nama: 'Budi' });
    expect(row).toEqual({ id: 'a2', nama: 'Budi' });
    expect(db.lastQuery).toContain('OUTPUT INSERTED.*');
  });

  test('update mengembalikan null bila baris tidak ada', async () => {
    await expect(repo.update('ghost', { nama: 'X' })).resolves.toBeNull();
  });

  test('remove memakai OUTPUT DELETED dan memetakan hasil', async () => {
    db.rows = [{ id: 'a1', nama: 'Ani' }];
    await expect(repo.remove('a1')).resolves.toEqual({ id: 'a1', nama: 'Ani' });
    expect(db.lastQuery).toContain('OUTPUT DELETED.*');
  });
});
