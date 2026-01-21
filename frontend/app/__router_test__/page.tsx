'use client';

import Link from 'next/link';

export default function RouterTest() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Router test</h1>

      <Link href="/login">
        <span style={{ color: 'blue', cursor: 'pointer' }}>
          Go to login
        </span>
      </Link>
    </div>
  );
}
