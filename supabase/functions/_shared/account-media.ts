interface RpcClient {
  rpc(name: string, args?: Record<string, unknown>): PromiseLike<{ data: unknown; error: unknown }>;
}

export async function withAccountMediaUpload<T>(client: RpcClient, upload: () => Promise<T>): Promise<T> {
  const lease = await client.rpc('begin_account_media_upload');
  if (lease.error || typeof lease.data !== 'string') {
    throw new Error('Cannot upload media while account deletion is pending.');
  }

  try {
    return await upload();
  } finally {
    // A failed release expires after two minutes. Do not hide a completed upload.
    try {
      const result = await client.rpc('finish_account_media_upload', { upload_id: lease.data });
      if (result.error) console.error('Could not release account media upload lease.');
    } catch {
      console.error('Could not release account media upload lease.');
    }
  }
}
