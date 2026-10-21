import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { styles } from '@/components/balances/styles';

/** "Updated 12s ago", ticking every second, from the snapshot's server time. */
export function UpdatedAgo({ asOf }: { asOf: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  // Clamp: a device clock slightly behind the server would give negative seconds.
  const seconds = Math.max(0, Math.round((now - Date.parse(asOf)) / 1000));
  const label = seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m`;
  return <Text style={styles.muted}>Updated {label} ago</Text>;
}
