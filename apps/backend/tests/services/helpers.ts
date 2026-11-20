import ApiError from '../../src/errors/ApiError';

/** Ambil error dari promise yang seharusnya gagal. */
export const ambilError = async (promise: Promise<unknown>): Promise<ApiError> => {
  try {
    await promise;
  } catch (err) {
    return err as ApiError;
  }
  throw new Error('Diharapkan ApiError, tetapi promise berhasil');
};

/** Ambil error dari pemanggilan sinkron yang seharusnya gagal. */
export const ambilErrorSync = (fn: () => unknown): ApiError => {
  try {
    fn();
  } catch (err) {
    return err as ApiError;
  }
  throw new Error('Diharapkan ApiError, tetapi tidak ada error');
};
