import React, { useEffect, useState } from 'react';
import { currentUpdate, subscribeToUpdates } from '../../data/app-update';
export default function AppUpdateNotice() {
  const [apply, setApply] = useState(currentUpdate), [busy, setBusy] = useState(false), [failed, setFailed] = useState(false);
  useEffect(() => subscribeToUpdates(() => setApply(() => currentUpdate())), []);
  if (!apply) return null;
  return <aside className="app-update-notice" role="status">
    <span>{failed ? 'The update could not finish. Your drink is still here.' : 'A new version is ready. Your drink and saved orders will stay.'}</span>
    <button disabled={busy} onClick={async () => { setBusy(true); setFailed(false); try { await apply(); } catch { setBusy(false); setFailed(true); } }}>{busy ? 'Updating…' : 'Update now'}</button>
  </aside>;
}
